import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createChatServer } from './server.mjs';

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function createFixture(options = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'minimind-chat-'));
  let ollamaRequest = null;

  const ollama = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    ollamaRequest = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    res.write(`${JSON.stringify({ message: { role: 'assistant', content: '你' } })}\n`);
    res.write(`${JSON.stringify({ message: { role: 'assistant', content: '好' } })}\n`);
    res.end(`${JSON.stringify({ done: true })}\n`);
  });

  const ollamaUrl = await listen(ollama);
  const app = createChatServer({
    dataDir,
    ollamaUrl,
    model: 'minimind',
    ...options
  });
  const baseUrl = await listen(app.server);

  return {
    app,
    baseUrl,
    getOllamaRequest: () => ollamaRequest,
    async close() {
      await app.close();
      await new Promise((resolve) => ollama.close(resolve));
      await rm(dataDir, { recursive: true, force: true });
    }
  };
}

function cookieFrom(response) {
  return response.headers.get('set-cookie').split(';', 1)[0];
}

test('页面、健康检查和会话 Cookie 可用', async () => {
  const fixture = await createFixture();
  try {
    const page = await fetch(`${fixture.baseUrl}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
    assert.match(await page.text(), /MiniMind/);

    const health = await fetch(`${fixture.baseUrl}/api/health`);
    assert.deepEqual(await health.json(), { status: 'ok', model: 'minimind' });

    const response = await fetch(`${fixture.baseUrl}/api/session`);
    const session = await response.json();
    assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    assert.ok(session.session.expiresAt - session.session.serverTime >= 86_399_000);
    assert.deepEqual(session.messages, []);
    assert.equal(session.model, 'minimind');
  } finally {
    await fixture.close();
  }
});

test('Ollama 流式回复会写入会话历史', async () => {
  const fixture = await createFixture();
  try {
    const sessionResponse = await fetch(`${fixture.baseUrl}/api/session`);
    const cookie = cookieFrom(sessionResponse);

    const response = await fetch(`${fixture.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '你好 MiniMind' })
    });
    const stream = await response.text();
    assert.equal(response.status, 200);
    assert.match(stream, /event: meta/);
    assert.match(stream, /"content":"你"/);
    assert.match(stream, /"content":"好"/);
    assert.match(stream, /event: done/);

    const ollamaRequest = fixture.getOllamaRequest();
    assert.equal(ollamaRequest.model, 'minimind');
    assert.equal(ollamaRequest.messages.at(-1).content, '你好 MiniMind');

    const stateResponse = await fetch(`${fixture.baseUrl}/api/session`, {
      headers: { Cookie: cookie }
    });
    const state = await stateResponse.json();
    assert.equal(state.conversations.length, 1);
    assert.equal(state.conversation.title, '你好 MiniMind');
    assert.deepEqual(
      state.messages.map(({ role, content }) => ({ role, content })),
      [
        { role: 'user', content: '你好 MiniMind' },
        { role: 'assistant', content: '你好' }
      ]
    );
  } finally {
    await fixture.close();
  }
});

test('切换会话会保存当前状态', async () => {
  const fixture = await createFixture();
  try {
    const sessionResponse = await fetch(`${fixture.baseUrl}/api/session`);
    const cookie = cookieFrom(sessionResponse);
    const headers = { Cookie: cookie, 'Content-Type': 'application/json' };

    const firstResponse = await fetch(`${fixture.baseUrl}/api/conversations`, {
      method: 'POST',
      headers
    });
    const first = await firstResponse.json();
    const secondResponse = await fetch(`${fixture.baseUrl}/api/conversations`, {
      method: 'POST',
      headers
    });
    const second = await secondResponse.json();

    let state = await (
      await fetch(`${fixture.baseUrl}/api/session`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(state.activeConversationId, second.conversation.id);

    await fetch(
      `${fixture.baseUrl}/api/conversations/${first.conversation.id}/activate`,
      { method: 'POST', headers }
    );
    state = await (
      await fetch(`${fixture.baseUrl}/api/session`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(state.activeConversationId, first.conversation.id);
  } finally {
    await fixture.close();
  }
});

test('达到 24 小时后会话与消息会被清理', async () => {
  let clock = 1_800_000_000_000;
  const fixture = await createFixture({ now: () => clock });
  try {
    const sessionResponse = await fetch(`${fixture.baseUrl}/api/session`);
    const cookie = cookieFrom(sessionResponse);
    const headers = { Cookie: cookie, 'Content-Type': 'application/json' };

    const chatResponse = await fetch(`${fixture.baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: '这条消息应当过期' })
    });
    const chatStream = await chatResponse.text();
    assert.doesNotMatch(chatStream, /event: error/, chatStream);
    let state = await (
      await fetch(`${fixture.baseUrl}/api/session`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(state.messages.length, 2);

    clock += 24 * 60 * 60 * 1000;
    const expiredResponse = await fetch(`${fixture.baseUrl}/api/session`, {
      headers: { Cookie: cookie }
    });
    state = await expiredResponse.json();
    assert.equal(state.messages.length, 0);
    assert.equal(state.conversations.length, 0);
    assert.equal(state.session.expiresAt, clock + 24 * 60 * 60 * 1000);
    assert.ok(expiredResponse.headers.get('set-cookie'));
  } finally {
    await fixture.close();
  }
});
