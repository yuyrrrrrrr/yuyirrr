const elements = {
  form: document.querySelector('#composer'),
  input: document.querySelector('#message-input'),
  inputHint: document.querySelector('#input-hint'),
  send: document.querySelector('#send'),
  sendingLabel: document.querySelector('#sending-label'),
  messageList: document.querySelector('#message-list'),
  messages: document.querySelector('#messages'),
  emptyState: document.querySelector('#empty-state'),
  historyList: document.querySelector('#history-list'),
  historyCount: document.querySelector('#history-count'),
  newChat: document.querySelector('#new-chat'),
  resetSession: document.querySelector('#reset-session'),
  expiry: document.querySelector('#expiry-time'),
  modelName: document.querySelector('#model-name'),
  notice: document.querySelector('#notice')
};

const state = {
  activeConversationId: null,
  conversations: [],
  messages: [],
  expiresAt: 0,
  streaming: false,
  expired: false
};

let noticeTimer;

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '请求失败，请稍后重试');
  return data;
}

function showNotice(message, type = 'info') {
  window.clearTimeout(noticeTimer);
  elements.notice.textContent = message;
  elements.notice.dataset.type = type;
  elements.notice.classList.add('is-visible');
  noticeTimer = window.setTimeout(() => {
    elements.notice.classList.remove('is-visible');
  }, 5000);
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

function setMessages(nextMessages) {
  state.messages = nextMessages;
  elements.messageList.replaceChildren();
  elements.emptyState.hidden = nextMessages.length > 0;

  for (const message of nextMessages) {
    elements.messageList.append(createMessageElement(message));
  }
  scrollToLatest(true);
}

function createMessageElement(message, streaming = false) {
  const article = document.createElement('article');
  article.className = `message message--${message.role}`;
  if (streaming) article.classList.add('is-streaming');

  const meta = document.createElement('div');
  meta.className = 'message__meta';
  meta.textContent = message.role === 'user' ? '你' : 'MiniMind';

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';
  const content = document.createElement('p');
  content.textContent = message.content;
  bubble.append(content);

  if (!streaming && message.createdAt) {
    const time = document.createElement('time');
    time.dateTime = new Date(message.createdAt).toISOString();
    time.textContent = formatTime(message.createdAt);
    meta.append(time);
  }

  article.append(meta, bubble);
  return article;
}

function appendMessage(message, streaming = false) {
  elements.emptyState.hidden = true;
  const element = createMessageElement(message, streaming);
  elements.messageList.append(element);
  scrollToLatest(true);
  return element;
}

function scrollToLatest(force = false) {
  const distance =
    elements.messages.scrollHeight -
    elements.messages.scrollTop -
    elements.messages.clientHeight;
  if (force || distance < 180) {
    requestAnimationFrame(() => {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    });
  }
}

function renderHistory() {
  elements.historyList.replaceChildren();
  elements.historyCount.textContent = String(state.conversations.length);

  if (!state.conversations.length) {
    const empty = document.createElement('p');
    empty.className = 'history__empty';
    empty.textContent = '还没有会话';
    elements.historyList.append(empty);
    return;
  }

  for (const conversation of state.conversations) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    if (conversation.id === state.activeConversationId) {
      button.classList.add('is-active');
      button.setAttribute('aria-current', 'true');
    }

    const title = document.createElement('span');
    title.textContent = conversation.title;
    const count = document.createElement('small');
    count.textContent = `${conversation.messageCount} 条消息`;
    button.append(title, count);
    button.addEventListener('click', () => openConversation(conversation.id));
    elements.historyList.append(button);
  }
}

function applySession(data) {
  state.activeConversationId = data.activeConversationId;
  state.conversations = data.conversations;
  state.expiresAt = data.session.expiresAt;
  state.expired = false;
  elements.modelName.textContent = data.model;
  renderHistory();
  setMessages(data.messages);
  updateExpiry();
}

async function loadSession() {
  const data = await api('/api/session');
  applySession(data);
}

async function refreshHistory() {
  const data = await api('/api/session');
  state.conversations = data.conversations;
  state.expiresAt = data.session.expiresAt;
  renderHistory();
}

async function openConversation(conversationId) {
  if (state.streaming || conversationId === state.activeConversationId) return;
  try {
    const data = await api(`/api/conversations/${conversationId}/activate`, {
      method: 'POST'
    });
    state.activeConversationId = data.conversation.id;
    state.messages = data.messages;
    renderHistory();
    setMessages(data.messages);
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

async function newConversation() {
  if (state.streaming) return;
  if (!state.messages.length && state.activeConversationId) {
    elements.input.focus();
    return;
  }

  try {
    const data = await api('/api/conversations', { method: 'POST' });
    state.activeConversationId = data.conversation.id;
    state.conversations = [
      { ...data.conversation, messageCount: 0 },
      ...state.conversations
    ];
    renderHistory();
    setMessages([]);
    elements.input.focus();
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

function setStreaming(isStreaming) {
  state.streaming = isStreaming;
  elements.send.disabled = isStreaming;
  elements.sendingLabel.classList.toggle('is-visible', isStreaming);
  elements.form.classList.toggle('is-streaming', isStreaming);
}

function updateInput() {
  const length = Array.from(elements.input.value).length;
  elements.inputHint.textContent = `${length} / 4000`;
  elements.input.style.height = 'auto';
  elements.input.style.height = `${Math.min(elements.input.scrollHeight, 168)}px`;
}

function readSseBlock(block) {
  let event = 'message';
  const dataLines = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  return {
    event,
    data: dataLines.length ? JSON.parse(dataLines.join('\n')) : null
  };
}

async function sendMessage() {
  const content = elements.input.value.trim();
  if (!content || state.streaming) return;

  elements.input.value = '';
  updateInput();
  setStreaming(true);
  showNotice('');

  const userMessage = { role: 'user', content, createdAt: Date.now() };
  appendMessage(userMessage);
  const assistantElement = appendMessage(
    { role: 'assistant', content: '' },
    true
  );
  const assistantContent = assistantElement.querySelector('.message__bubble p');
  let answer = '';
  let completed = false;
  let streamError = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: state.activeConversationId,
        message: content
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || '无法连接到对话服务');
    }
    if (!response.body) throw new Error('浏览器不支持流式响应');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      let boundary = buffer.indexOf('\n\n');

      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
        const message = readSseBlock(block);

        if (message.event === 'meta') {
          const isNewConversation = !state.activeConversationId;
          state.activeConversationId = message.data.conversationId;
          if (isNewConversation) {
            state.conversations.unshift({
              id: message.data.conversationId,
              title: message.data.title,
              messageCount: 1
            });
            renderHistory();
          }
        }

        if (message.event === 'delta') {
          answer += message.data.content;
          assistantContent.textContent = answer;
          scrollToLatest();
        }

        if (message.event === 'error') {
          streamError = message.data.message;
        }

        if (message.event === 'done') {
          completed = true;
        }
      }

      if (done) break;
    }

    if (streamError) throw new Error(streamError);
    if (!completed) throw new Error('回复连接意外中断');
  } catch (error) {
    assistantElement.classList.add('has-error');
    assistantContent.textContent = answer
      ? `${answer}\n\n[回复中断]`
      : `这次没有收到回复。${error.message || '请稍后再试。'}`;
    showNotice(error.message || '发送失败', 'error');
  } finally {
    assistantElement.classList.remove('is-streaming');
    setStreaming(false);
    state.messages.push(
      userMessage,
      { role: 'assistant', content: assistantContent.textContent }
    );
    try {
      await refreshHistory();
    } catch {
      // 历史列表刷新失败不影响本轮回复展示
    }
    elements.input.focus();
    scrollToLatest();
  }
}

function updateExpiry() {
  if (!state.expiresAt) return;
  const remaining = state.expiresAt - Date.now();
  if (remaining <= 0) {
    elements.expiry.textContent = '已过期';
    if (!state.expired) {
      state.expired = true;
      window.setTimeout(async () => {
        try {
          await loadSession();
          showNotice('上一段记录已过期，已开始新的 24 小时会话');
        } catch (error) {
          showNotice(error.message, 'error');
        }
      }, 500);
    }
    return;
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  elements.expiry.textContent =
    hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage();
});

elements.input.addEventListener('input', updateInput);
elements.input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    elements.form.requestSubmit();
  }
});

elements.newChat.addEventListener('click', newConversation);

elements.resetSession.addEventListener('click', async () => {
  if (state.streaming) return;
  const confirmed = window.confirm('确定删除本次 24 小时内的全部对话吗？');
  if (!confirmed) return;
  try {
    await api('/api/session/reset', { method: 'POST' });
    await loadSession();
    showNotice('记录已清除');
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

for (const button of document.querySelectorAll('[data-prompt]')) {
  button.addEventListener('click', () => {
    elements.input.value = button.dataset.prompt || '';
    updateInput();
    elements.input.focus();
  });
}

updateInput();
window.setInterval(updateExpiry, 30_000);
loadSession().catch((error) => {
  elements.modelName.textContent = '离线';
  showNotice(`页面初始化失败：${error.message}`, 'error');
});
