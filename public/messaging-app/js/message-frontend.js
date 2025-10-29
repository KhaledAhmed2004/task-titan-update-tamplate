import { SERVER_ORIGIN } from './config.js';
import { state, setToken, setCurrentChat, clearAuth, renderedMessageIds } from './store.js';
import { api, login, getChats, getMessages, markChatRead, sendText, uploadAttachments } from './api.js';
import { els, setConnectionStatus, renderChatList, renderMessages, renderAttachmentHtml, updateChatListItem, createUploadPlaceholder, formatLastSeen } from './dom.js';
import { setupSocket, joinChatRoom, joinAllChatRooms, emitTyping } from './socket.js';

function selectChat(chatId, other) {
  setCurrentChat(chatId);
  els.threadName.textContent = other?.name || 'Chat';
  if (other?.presence?.isOnline) {
    els.threadPresence.textContent = 'Online';
  } else {
    const ts = other?.presence?.lastActive;
    els.threadPresence.textContent = ts ? `Last seen ${formatLastSeen(ts)}` : 'Offline';
  }
  joinChatRoom(chatId);
  getMessages(chatId)
    .then(res => {
      const { messages = [] } = res.data || {};
      renderMessages(messages, state.currentUser?.id);
    })
    .catch(console.error)
    .finally(() => {
      markChatRead(chatId)
        .then(() => updateChatListItem(chatId, { resetUnread: true }))
        .catch(() => {});
    });
}

async function loadChats() {
  try {
    const res = await getChats();
    const chats = res.data || [];
    renderChatList(chats, selectChat);
    joinAllChatRooms(chats);
  } catch (err) {
    const status = err?.status;
    if (status === 403) {
      els.loginMsg.textContent = 'চ্যাট লোড হয়নি: আপনার রোল এই API ব্যবহারের অনুমতি নেই (POSTER/TASKER দরকার)';
    } else if (status === 401) {
      els.loginMsg.textContent = 'চ্যাট লোড হয়নি: অথরাইজেশন টোকেন প্রয়োজন বা সঠিক নয়';
    } else {
      els.loginMsg.textContent = 'চ্যাট লোড হয়নি: ' + (err?.message || 'এরর');
    }
  }
}

async function handleSend() {
  const text = els.messageInput.value.trim();
  if (!text || !state.currentChatId) return;
  els.messageInput.value = '';
  try {
    const res = await sendText(state.currentChatId, text);
    const msg = res.data;
    const mine = Array.isArray(msg) ? msg[0] : msg;
    const sentId = String(mine?._id || '');
    if (!sentId || !renderedMessageIds.has(sentId)) {
      const el = document.createElement('div');
      el.className = 'msg me';
      el.dataset.id = sentId;
      const created = mine?.createdAt ? new Date(mine.createdAt).toLocaleString() : 'just now';
      el.innerHTML = `<div>${mine?.text || text}</div><div class="meta">${created} · text · <span class="status status-sent">sent</span></div>`;
      els.messages.appendChild(el);
      els.messages.scrollTop = els.messages.scrollHeight;
      if (sentId) renderedMessageIds.add(sentId);
    }
    updateChatListItem(state.currentChatId, { text: mine?.text || text });
    joinChatRoom(state.currentChatId);
    setTimeout(async () => {
      try {
        const idOk = sentId && renderedMessageIds.has(sentId);
        if (!idOk) {
          const r = await getMessages(state.currentChatId);
          const { messages = [] } = r.data || {};
          renderMessages(messages, state.currentUser?.id);
        }
      } catch {}
    }, 1200);
  } catch (err) {
    console.error('send failed', err);
  }
}

function handleAttachmentSelection(ev) {
  const files = ev.target.files;
  if (!files || files.length === 0 || !state.currentChatId) return;
  const text = els.messageInput.value.trim();
  els.messageInput.value = '';
  const ph = createUploadPlaceholder(files, text);
  uploadAttachments(state.currentChatId, files, text, state.token)
    .then(msg => {
      const id = String(msg?._id || '');
      if (id) renderedMessageIds.add(id);
      const created = msg?.createdAt ? new Date(msg.createdAt).toLocaleString() : 'just now';
      const attHtml = renderAttachmentHtml(msg?.attachments || []);
      ph.dataset.id = id || ph.dataset.id;
      ph.innerHTML = `<div>${msg?.text || text || ''}</div>${attHtml}<div class="meta">${created} · ${msg?.type || 'mixed'} · <span class="status status-sent">sent</span></div>`;
      joinChatRoom(state.currentChatId);
      updateChatListItem(state.currentChatId, { text: msg?.text || text || '[attachments]' });
    })
    .catch(err => {
      try {
        const meta = ph.querySelector('.meta');
        if (meta) meta.textContent = 'Upload failed';
      } catch {}
      console.error('upload failed', err);
    })
    .finally(() => {
      try { ev.target.value = ''; } catch {}
    });
}

async function handleLogin() {
  const email = els.email.value.trim();
  const password = els.password.value.trim();
  els.loginMsg.textContent = '';
  try {
    const token = await login(email, password);
    setToken(token);
    const user = state.currentUser || { email };
    els.userEmail.textContent = user.email || email;
    els.userRole.textContent = user?.role ? `(role: ${user.role})` : '';
    els.logoutBtn.classList.remove('hidden');
    els.loginSection.classList.add('hidden');
    setupSocket();
    await loadChats();
  } catch (err) {
    els.loginMsg.textContent = 'লগইন ব্যর্থ: ' + (err?.message || 'নেটওয়ার্ক/সার্ভার এরর');
  }
}

function handleLogout() {
  clearAuth();
  setConnectionStatus(false);
  els.userEmail.textContent = 'Not logged in';
  els.logoutBtn.classList.add('hidden');
  els.loginSection.classList.remove('hidden');
  els.chatList.innerHTML = '';
  els.messages.innerHTML = '';
  els.threadName.textContent = 'Select a chat';
  els.threadPresence.textContent = '—';
}

function init() {
  els.serverUrl.textContent = SERVER_ORIGIN;
  els.loginBtn.addEventListener('click', handleLogin);
  els.logoutBtn.addEventListener('click', handleLogout);
  els.sendBtn.addEventListener('click', handleSend);
  els.messageInput.addEventListener('input', emitTyping);
  els.attachBtn.addEventListener('click', () => els.attachmentInput.click());
  els.attachmentInput.addEventListener('change', handleAttachmentSelection);

  if (state.token) {
    const user = (state.currentUser = state.currentUser || null);
    if (!user) {
      // try decode
      try {
        const decoded = JSON.parse(atob((state.token.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
        state.currentUser = decoded;
      } catch {}
    }
    if (state.currentUser) {
      els.userEmail.textContent = state.currentUser.email || 'Logged in';
      els.userRole.textContent = state.currentUser?.role ? `(role: ${state.currentUser.role})` : '';
      els.logoutBtn.classList.remove('hidden');
      els.loginSection.classList.add('hidden');
      setupSocket();
      loadChats();
    } else {
      localStorage.removeItem('token');
    }
  }
}

// Boot
init();