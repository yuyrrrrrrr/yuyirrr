import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const DAY_MS = 24 * 60 * 60 * 1000;
const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const SESSION_COOKIE = 'minimind_session';

const assets = new Map(
  [
    ['/', ['index.html', 'text/html; charset=utf-8']],
    ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
    ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
    ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
  ].map(([path, [file, contentType]]) => [
    path,
    {
      body: readFileSync(join(PUBLIC_DIR, file)),
      contentType
    }
  ])
);

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, pair) => {
    const index = pair.indexOf('=');
    if (index > 0) {
      cookies[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
    }
    return cookies;
  }, {});
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createToken() {
  return randomBytes(32).toString('base64url');
}

function makeTitle(content) {
  const title = content.replace(/\s+/g, ' ').trim();
  return Array.from(title).slice(0, 24).join('') || '新对话';
}

function isSecureRequest(req) {
  return (
    req.socket.encrypted ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production'
  );
}

function sessionCookie(token, expiresAt, req) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=86400',
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function sendSse(res, event, payload) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

async function readJson(req, limit = 16 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, '请求内容过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, '请求格式无效');
  }
}

function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  try {
    if (new URL(origin).host !== req.headers.host) {
      throw new HttpError(403, '请求来源无效');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, '请求来源无效');
  }
}

function readAsset(pathname, method) {
  const asset = assets.get(pathname);
  if (!asset) return null;
  return {
    body: method === 'HEAD' ? '' : asset.body,
    contentType: asset.contentType,
    size: asset.body.length
  };
}

export function createChatServer(options = {}) {
  const now = options.now ?? (() => Date.now());
  const ttlMs = options.ttlMs ?? DAY_MS;
  const ollamaUrl = normalizeBaseUrl(
    options.ollamaUrl ?? process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434'
  );
  const model = options.model ?? process.env.OLLAMA_MODEL ?? 'minimind';
  const systemPrompt =
    options.systemPrompt ??
    process.env.SYSTEM_PROMPT ??
    '你是 MiniMind，一个简洁、诚实的小型语言模型。优先使用中文回答，不确定时直接说明。';
  const dataDir = options.dataDir ?? process.env.DATA_DIR ?? join(ROOT_DIR, 'data');
  const maxHistory = options.maxHistory ?? 16;
  const requestTimeoutMs = options.requestTimeoutMs ?? 120_000;
  const numCtx = options.numCtx ?? Number(process.env.OLLAMA_NUM_CTX ?? 2048);

  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, 'chat.sqlite'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS user_state (
      user_id TEXT PRIMARY KEY,
      active_conversation_id TEXT,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;

    CREATE INDEX IF NOT EXISTS conversations_user_updated
      ON conversations(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS messages_conversation_id
      ON messages(conversation_id, id);
    CREATE INDEX IF NOT EXISTS users_expires_at
      ON users(expires_at);
  `);

  const statements = {
    getUser: db.prepare('SELECT id, expires_at FROM users WHERE id = ?'),
    deleteExpired: db.prepare('DELETE FROM users WHERE expires_at <= ?'),
    createUser: db.prepare(
      'INSERT INTO users (id, created_at, expires_at) VALUES (?, ?, ?)'
    ),
    createState: db.prepare(
      'INSERT INTO user_state (user_id, active_conversation_id, updated_at) VALUES (?, NULL, ?)'
    ),
    getState: db.prepare(
      'SELECT active_conversation_id FROM user_state WHERE user_id = ?'
    ),
    setState: db.prepare(`
      INSERT INTO user_state (user_id, active_conversation_id, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        active_conversation_id = excluded.active_conversation_id,
        updated_at = excluded.updated_at
    `),
    listConversations: db.prepare(`
      SELECT c.id, c.title, c.updated_at, COUNT(m.id) AS message_count
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT 30
    `),
    getConversation: db.prepare(`
      SELECT id, title, created_at, updated_at
      FROM conversations
      WHERE id = ? AND user_id = ?
    `),
    latestConversation: db.prepare(`
      SELECT id FROM conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `),
    createConversation: db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `),
    updateConversation: db.prepare(
      'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ),
    listMessages: db.prepare(`
      SELECT id, role, content, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY id ASC
    `),
    recentMessages: db.prepare(`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ?
      ORDER BY id DESC
      LIMIT ?
    `),
    addMessage: db.prepare(`
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `),
    countMessages: db.prepare(
      'SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ?'
    ),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?')
  };

  function cleanup() {
    statements.deleteExpired.run(now());
  }

  cleanup();
  const cleanupTimer = setInterval(cleanup, 15 * 60 * 1000);
  cleanupTimer.unref();

  function getOrCreateSession(req, res) {
    cleanup();
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) {
      const userId = hashToken(token);
      const user = statements.getUser.get(userId);
      if (user && user.expires_at > now()) {
        return { id: user.id, expiresAt: user.expires_at, isNew: false };
      }
    }

    const newToken = createToken();
    const id = hashToken(newToken);
    const createdAt = now();
    const expiresAt = createdAt + ttlMs;
    statements.createUser.run(id, createdAt, expiresAt);
    statements.createState.run(id, createdAt);
    res.setHeader('Set-Cookie', sessionCookie(newToken, expiresAt, req));
    return { id, expiresAt, isNew: true };
  }

  function activeConversationId(userId) {
    const state = statements.getState.get(userId);
    if (state?.active_conversation_id) {
      const existing = statements.getConversation.get(state.active_conversation_id, userId);
      if (existing) return existing.id;
    }
    const latest = statements.latestConversation.get(userId);
    if (latest?.id) statements.setState.run(userId, latest.id, now());
    return latest?.id ?? null;
  }

  function getSessionPayload(session) {
    const activeId = activeConversationId(session.id);
    const conversation = activeId
      ? statements.getConversation.get(activeId, session.id)
      : null;
    return {
      session: {
        expiresAt: session.expiresAt,
        serverTime: now(),
        isNew: session.isNew
      },
      model,
      activeConversationId: activeId,
      conversations: statements.listConversations.all(session.id).map((item) => ({
        id: item.id,
        title: item.title,
        updatedAt: item.updated_at,
        messageCount: item.message_count
      })),
      messages: activeId
        ? statements.listMessages.all(activeId).map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.created_at
          }))
        : [],
      conversation: conversation
        ? {
            id: conversation.id,
            title: conversation.title,
            updatedAt: conversation.updated_at
          }
        : null
    };
  }

  function createConversation(userId, title = '新对话') {
    const createdAt = now();
    const conversation = {
      id: randomUUID(),
      title,
      createdAt,
      updatedAt: createdAt
    };
    statements.createConversation.run(
      conversation.id,
      userId,
      conversation.title,
      conversation.createdAt,
      conversation.updatedAt
    );
    statements.setState.run(userId, conversation.id, createdAt);
    return conversation;
  }

  function requireConversation(userId, conversationId) {
    const conversation = statements.getConversation.get(conversationId, userId);
    if (!conversation) throw new HttpError(404, '会话不存在或已过期');
    return conversation;
  }

  async function streamOllamaChat(res, userId, conversation, content) {
    const controller = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on('close', onClose);

    const createdAt = now();
    statements.addMessage.run(conversation.id, 'user', content, createdAt);
    if (statements.countMessages.get(conversation.id).count === 1) {
      conversation.title = makeTitle(content);
    }
    statements.updateConversation.run(
      conversation.title,
      createdAt,
      conversation.id,
      userId
    );

    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Security-Policy': "default-src 'none'"
    });
    res.flushHeaders();
    sendSse(res, 'meta', {
      conversationId: conversation.id,
      title: conversation.title,
      expiresAt: statements.getUser.get(userId).expires_at
    });

    const history = statements.recentMessages
      .all(conversation.id, maxHistory)
      .reverse()
      .map((message) => ({ role: message.role, content: message.content }));

    let answer = '';
    try {
      const upstream = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: true,
          keep_alive: '10m',
          messages: [{ role: 'system', content: systemPrompt }, ...history],
          options: { num_ctx: numCtx }
        }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(requestTimeoutMs)])
      });

      if (!upstream.ok) {
        const detail = (await upstream.text()).slice(0, 300);
        throw new Error(`Ollama 返回 ${upstream.status}: ${detail}`);
      }
      if (!upstream.body) throw new Error('Ollama 未返回响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      const handleLine = (line) => {
        if (!line.trim()) return;
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error(chunk.error);
        const delta = chunk.message?.content;
        if (delta) {
          answer += delta;
          sendSse(res, 'delta', { content: delta });
        }
      };

      for await (const chunk of upstream.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let newlineIndex = buffer.indexOf('\n');
        while (newlineIndex !== -1) {
          handleLine(buffer.slice(0, newlineIndex));
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf('\n');
        }
      }
      buffer += decoder.decode();
      handleLine(buffer);

      if (!answer) throw new Error('模型没有返回内容');
      const completedAt = now();
      statements.addMessage.run(conversation.id, 'assistant', answer, completedAt);
      statements.updateConversation.run(
        conversation.title,
        completedAt,
        conversation.id,
        userId
      );
      sendSse(res, 'done', {
        conversationId: conversation.id,
        title: conversation.title,
        createdAt: completedAt
      });
    } catch (error) {
      const message =
        error.name === 'AbortError' || error.name === 'TimeoutError'
          ? '模型响应超时或连接已中断'
          : error.message;
      if (!res.writableEnded && !res.destroyed) {
        sendSse(res, 'error', { message: `模型暂时不可用：${message}` });
      }
    } finally {
      res.off('close', onClose);
      if (!res.writableEnded && !res.destroyed) res.end();
    }
  }

  const server = createServer(async (req, res) => {
    try {
      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const pathname = url.pathname;

      if (method === 'GET' || method === 'HEAD') {
        const asset = readAsset(pathname, method);
        if (asset) {
          res.writeHead(200, {
            ...securityHeaders,
            'Content-Type': asset.contentType,
            'Content-Length': asset.size,
            'Cache-Control': 'no-cache',
            'Content-Security-Policy':
              "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
          });
          res.end(asset.body);
          return;
        }
      }

      if (pathname === '/api/health' && method === 'GET') {
        sendJson(res, 200, { status: 'ok', model });
        return;
      }

      if (!pathname.startsWith('/api/')) {
        sendJson(res, 404, { error: '页面不存在' });
        return;
      }

      if (method !== 'GET' && method !== 'HEAD') assertSameOrigin(req);
      const session = getOrCreateSession(req, res);

      if (pathname === '/api/session' && method === 'GET') {
        sendJson(res, 200, getSessionPayload(session));
        return;
      }

      if (pathname === '/api/session/reset' && method === 'POST') {
        statements.deleteUser.run(session.id);
        sendJson(
          res,
          200,
          { reset: true },
          { 'Set-Cookie': clearSessionCookie() }
        );
        return;
      }

      if (pathname === '/api/conversations' && method === 'POST') {
        const conversation = createConversation(session.id);
        sendJson(res, 201, {
          conversation: {
            id: conversation.id,
            title: conversation.title,
            updatedAt: conversation.updatedAt
          },
          messages: []
        });
        return;
      }

      const activateMatch = pathname.match(
        /^\/api\/conversations\/([0-9a-f-]+)\/activate$/
      );
      if (activateMatch && method === 'POST') {
        const conversation = requireConversation(session.id, activateMatch[1]);
        statements.setState.run(session.id, conversation.id, now());
        sendJson(res, 200, {
          conversation: {
            id: conversation.id,
            title: conversation.title,
            updatedAt: conversation.updated_at
          },
          messages: statements.listMessages.all(conversation.id).map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.created_at
          }))
        });
        return;
      }

      if (pathname === '/api/chat' && method === 'POST') {
        const body = await readJson(req);
        const content = typeof body.message === 'string' ? body.message.trim() : '';
        if (!content) throw new HttpError(400, '请输入消息');
        if (Array.from(content).length > 4000) {
          throw new HttpError(413, '消息不能超过 4000 个字符');
        }

        const conversation = body.conversationId
          ? requireConversation(session.id, String(body.conversationId))
          : createConversation(session.id);
        await streamOllamaChat(res, session.id, conversation, content);
        return;
      }

      sendJson(res, 404, { error: '接口不存在' });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        status === 500 ? '服务器处理请求时出错' : error.message;
      if (!res.headersSent) sendJson(res, status, { error: message });
      else if (!res.writableEnded && !res.destroyed) res.end();
      if (status === 500) console.error(error);
    }
  });

  async function close() {
    clearInterval(cleanupTimer);
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    db.close();
  }

  return { server, db, close, model, ttlMs };
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  const port = Number(process.env.PORT ?? 3210);
  const host = process.env.HOST ?? '127.0.0.1';
  const app = createChatServer();

  app.server.listen(port, host, () => {
    console.log(`MiniMind chat listening on http://${host}:${port} (${app.model})`);
  });

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
