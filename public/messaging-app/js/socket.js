import { SERVER_ORIGIN } from './config.js';
import { state, joinedChatIds, renderedMessageIds } from './store.js';
import { setConnectionStatus } from './dom.js';
import { updateChatListItem, els, formatLastSeen } from './dom.js';
import { markChatRead } from './api.js';

export function joinChatRoom(chatId) {
  if (!state.socket || !chatId) return;
  const key = String(chatId);
  if (joinedChatIds.has(key)) return;
  joinedChatIds.add(key);
  try {
    state.socket.emit('JOIN_CHAT', { chatId });
  } catch {}
}

export function joinAllChatRooms(chats) {
  if (!Array.isArray(chats)) return;
  chats.forEach(c => joinChatRoom(c?._id));
}

export function setupSocket() {
  if (!state.token) return;
  // Clean up old socket
  if (state.socket) {
    try {
      state.socket.off();
      state.socket.disconnect();
    } catch {}
    state.socket = null;
  }
  setConnectionStatus(false);
  let connectErrorStreak = 0;
  let connectErrorResetTimer = null;
  try {
    // global io provided by socket.io script in HTML
    // eslint-disable-next-line no-undef
    state.socket = io(SERVER_ORIGIN, {
      auth: { token: state.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      timeout: 20000,
    });
  } catch (e) {
    console.error(e);
    return;
  }

  state.socket.on('connect', () => {
    setConnectionStatus(true);
    connectErrorStreak = 0;
    if (connectErrorResetTimer) {
      try {
        clearTimeout(connectErrorResetTimer);
      } catch {}
      connectErrorResetTimer = null;
    }
    try {
      joinedChatIds.forEach(id => state.socket.emit('JOIN_CHAT', { chatId: id }));
    } catch {}
  });

  state.socket.on('disconnect', () => {
    setConnectionStatus(false);
  });

  try {
    state.socket.io.on?.('reconnect_attempt', () => {
      try {
        if (state.socket && state.socket.io && state.socket.io.opts) {
          state.socket.io.opts.auth = { token: state.token };
        }
      } catch {}
    });
  } catch {}

  state.socket.on('connect_error', err => {
    setConnectionStatus(false);
    connectErrorStreak++;
    if (connectErrorResetTimer) {
      try {
        clearTimeout(connectErrorResetTimer);
      } catch {}
    }
    connectErrorResetTimer = setTimeout(() => {
      connectErrorStreak = 0;
    }, 6000);

    const msg = 'সকেট কানেকশন সমস্যা: ' + (err?.message || 'Unknown error');
    try {
      els.loginMsg.textContent = msg;
    } catch {}
    console.warn('[socket connect_error]', {
      message: err?.message,
      data: err?.data,
      streak: connectErrorStreak,
      server: SERVER_ORIGIN,
    });

    if (connectErrorStreak >= 2 && state.token) {
      try {
        els.loginMsg.textContent = msg + ' — অনুগ্রহ করে আবার লগইন করুন (সম্ভবত টোকেন এক্সপায়ার্ড)।';
        els.logoutBtn.classList.remove('hidden');
        els.loginSection.classList.remove('hidden');
      } catch {}
    }
    if (connectErrorStreak >= 3 && state.token) {
      try {
        localStorage.removeItem('token');
        state.token = '';
        state.currentUser = null;
        console.warn('[socket] clearing token after repeated failures');
        els.userEmail.textContent = 'Not logged in';
        els.userRole.textContent = '';
        els.logoutBtn.classList.add('hidden');
        els.loginSection.classList.remove('hidden');
        try {
          state.socket?.off();
          state.socket?.disconnect();
        } catch {}
      } catch {}
    }
  });

  state.socket.on('error', err => {
    console.error('socket error', err);
  });

  // Real-time events
  state.socket.on('MESSAGE_SENT', payload => {
    const m = payload?.message || payload || {};
    const id = String(m?._id || '');
    const isMine = String(m?.sender) === String(state.currentUser?.id);
    const isCurrent = String(m?.chatId) === String(state.currentChatId);

    if (isMine && id && renderedMessageIds.has(id)) {
      return;
    }
    if (id) renderedMessageIds.add(id);

    updateChatListItem(m.chatId, {
      text: m.text || '',
      unreadIncrement: !isMine && !isCurrent ? 1 : 0,
      resetUnread: !isMine && isCurrent ? true : false,
    });

    if (!isMine && id) {
      try {
        state.socket.emit('DELIVERED_ACK', { messageId: id, chatId: m.chatId });
      } catch {}
    }

    if (isCurrent) {
      const el = document.createElement('div');
      el.className = 'msg' + (isMine ? ' me' : '');
      el.dataset.id = id;
      const statusHtml = isMine ? ` · <span class="status status-sent">sent</span>` : '';
      el.innerHTML = `<div>${m.text || ''}</div><div class="meta">${new Date(m.createdAt).toLocaleString()} · ${m.type}${statusHtml}</div>`;
      els.messages.appendChild(el);
      els.messages.scrollTop = els.messages.scrollHeight;
      if (!isMine) {
        markChatRead(m.chatId).catch(() => {});
      }
    }
  });

  state.socket.on('MESSAGE_DELIVERED', ({ messageId, chatId }) => {
    if (String(chatId) !== String(state.currentChatId)) return;
    const statusEl = els.messages.querySelector(`.msg[data-id="${String(messageId)}"] .status`);
    const bubble = els.messages.querySelector(`.msg[data-id="${String(messageId)}"]`);
    if (statusEl && bubble && bubble.classList.contains('me')) {
      statusEl.textContent = 'delivered';
      statusEl.classList.remove('status-sent', 'status-seen');
      statusEl.classList.add('status-delivered');
    }
  });

  state.socket.on('TYPING_START', ({ userId, chatId }) => {
    if (String(chatId) !== String(state.currentChatId) || String(userId) === String(state.currentUser?.id)) return;
    els.typing.classList.remove('hidden');
  });
  state.socket.on('TYPING_STOP', ({ userId, chatId }) => {
    if (String(chatId) !== String(state.currentChatId) || String(userId) === String(state.currentUser?.id)) return;
    els.typing.classList.add('hidden');
  });

  state.socket.on('MESSAGE_READ', ({ messageId, chatId }) => {
    if (String(chatId) !== String(state.currentChatId)) return;
    const statusEl = els.messages.querySelector(`.msg[data-id="${String(messageId)}"] .status`);
    const bubble = els.messages.querySelector(`.msg[data-id="${String(messageId)}"]`);
    if (statusEl && bubble && bubble.classList.contains('me')) {
      statusEl.textContent = 'seen';
      statusEl.classList.remove('status-sent', 'status-delivered');
      statusEl.classList.add('status-seen');
    }
  });

  state.socket.on('USER_ONLINE', ({ chatId }) => {
    if (String(chatId) === String(state.currentChatId)) {
      els.threadPresence.textContent = 'Online';
    }
  });
  state.socket.on('USER_OFFLINE', ({ chatId, lastActive }) => {
    if (String(chatId) === String(state.currentChatId)) {
      const tsText = lastActive ? `Last seen ${formatLastSeen(lastActive)}` : 'Offline';
      els.threadPresence.textContent = tsText;
    }
  });
}

export function emitTyping() {
  if (!state.socket || !state.currentChatId) return;
  try {
    state.socket.emit('TYPING_START', { chatId: state.currentChatId });
  } catch {}
  try { clearTimeout(state.typingTimer); } catch {}
  state.typingTimer = setTimeout(() => {
    try { state.socket.emit('TYPING_STOP', { chatId: state.currentChatId }); } catch {}
  }, state.TYPING_DEBOUNCE);
}