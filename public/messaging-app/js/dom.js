import { SERVER_ORIGIN } from './config.js';

export const els = {
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  loginBtn: document.getElementById('loginBtn'),
  loginMsg: document.getElementById('loginMsg'),
  loginSection: document.getElementById('loginSection'),
  serverUrl: document.getElementById('serverUrl'),
  connectionDot: document.getElementById('connectionDot'),
  userEmail: document.getElementById('userEmail'),
  userRole: document.getElementById('userRole'),
  logoutBtn: document.getElementById('logoutBtn'),
  chatList: document.getElementById('chatList'),
  threadName: document.getElementById('threadName'),
  threadPresence: document.getElementById('threadPresence'),
  messages: document.getElementById('messages'),
  typing: document.getElementById('typing'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  attachBtn: document.getElementById('attachBtn'),
  attachmentInput: document.getElementById('attachmentInput'),
};

export function setConnectionStatus(connected) {
  els.connectionDot.classList.toggle('online', connected);
  els.connectionDot.classList.toggle('offline', !connected);
}

export function formatLastSeen(ts) {
  try {
    if (!ts) return '—';
    const d = typeof ts === 'number' ? new Date(ts) : new Date(String(ts));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch {
    return '—';
  }
}

export function renderChatList(items, onSelect) {
  els.chatList.innerHTML = '';
  if (!items || !items.length) {
    const empty = document.createElement('div');
    empty.style.color = 'var(--muted)';
    empty.style.padding = '12px';
    empty.textContent = 'কোনো চ্যাট পাওয়া যায়নি';
    els.chatList.appendChild(empty);
    return;
  }
  items.forEach(chat => {
    const other = chat.participants?.[0] || {};
    const li = document.createElement('div');
    li.className = 'chat-item';
    li.dataset.chatId = chat._id;
    const presenceTitle = chat.presence?.isOnline
      ? 'Online'
      : `Last seen ${formatLastSeen(chat.presence?.lastActive)}`;
    li.innerHTML = `
      <div class="avatar" style="background-image:url('${other.image || ''}'); background-size:cover"></div>
      <div>
        <div class="name">${other.name || 'Unknown'}</div>
        <div class="preview">${chat.lastMessage?.text || ''}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge" style="${chat.unreadCount ? '' : 'display:none'}">${chat.unreadCount || ''}</span>
        <span class="presence ${chat.presence?.isOnline ? 'online' : 'offline'}" title="${presenceTitle}"></span>
      </div>
    `;
    // Pass presence info along with participant so header can show last seen
    if (typeof onSelect === 'function') li.addEventListener('click', () => onSelect(chat._id, { ...other, presence: chat.presence }));
    els.chatList.appendChild(li);
  });
}

export function findChatItem(chatId) {
  return els.chatList.querySelector(`[data-chat-id="${chatId}"]`);
}

export function updateChatListItem(chatId, { text, unreadIncrement = 0, resetUnread = false } = {}) {
  const li = findChatItem(chatId);
  if (!li) return;
  const previewEl = li.querySelector('.preview');
  if (previewEl && typeof text === 'string') previewEl.textContent = text;
  const badgeEl = li.querySelector('.badge');
  if (badgeEl) {
    let count = parseInt(badgeEl.textContent || '0', 10);
    if (Number.isNaN(count)) count = 0;
    if (resetUnread) count = 0; else count = count + (unreadIncrement || 0);
    if (count > 0) {
      badgeEl.textContent = String(count);
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.textContent = '';
      badgeEl.style.display = 'none';
    }
  }
}

export function renderAttachmentHtml(attList) {
  if (!Array.isArray(attList) || attList.length === 0) return '';
  const origin = SERVER_ORIGIN;
  const items = attList
    .map(att => {
      const url = String(att.url || '');
      const full = url.startsWith('http') ? url : origin + url;
      if (att.type === 'image') {
        return `<div class="attachment-card"><img class="attachment-thumb" src="${full}" alt="${att.name || ''}"/></div>`;
      }
      if (att.type === 'video') {
        return `<div class="attachment-card"><video class="attachment-thumb" src="${full}" controls></video></div>`;
      }
      if (att.type === 'audio') {
        return `<div class="attachment-card"><audio src="${full}" controls style="width:100%"></audio><div>${att.name || 'audio'}</div></div>`;
      }
      return `<div class="attachment-card"><a href="${full}" target="_blank" rel="noopener">${att.name || 'file'}</a></div>`;
    })
    .join('');
  return `<div class="attachment-grid">${items}</div>`;
}

export function renderMessages(list, myId) {
  els.messages.innerHTML = '';
  list.forEach(m => {
    const el = document.createElement('div');
    const isMine = String(m.sender) === String(myId);
    el.className = 'msg' + (isMine ? ' me' : '');
    el.dataset.id = String(m._id || '');
    let statusHtml = '';
    if (isMine) {
      const readCount = Array.isArray(m.readBy) ? m.readBy.length : 0;
      const deliveredCount = Array.isArray(m.deliveredTo) ? m.deliveredTo.length : 0;
      const status = readCount > 0 ? 'seen' : deliveredCount > 0 ? 'delivered' : 'sent';
      statusHtml = ` · <span class="status status-${status}">${status}</span>`;
    }
    const attHtml = renderAttachmentHtml(m.attachments || []);
    el.innerHTML = `
      <div>${m.text || ''}</div>
      ${attHtml}
      <div class="meta">${new Date(m.createdAt).toLocaleString()} · ${m.type}${statusHtml}</div>
    `;
    els.messages.appendChild(el);
  });
  els.messages.scrollTop = els.messages.scrollHeight;
}

export function classifyFieldName(file) {
  const t = file.type || '';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/') || t.startsWith('audio/')) return 'media';
  return 'doc';
}

export function createUploadPlaceholder(files, text) {
  const el = document.createElement('div');
  el.className = 'msg me';
  el.dataset.id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const items = Array.from(files)
    .map(f => {
      const field = classifyFieldName(f);
      if (field === 'image') {
        const url = URL.createObjectURL(f);
        return `<div class="attachment-card"><img class="attachment-thumb" src="${url}"/><div class="uploading">Uploading…</div></div>`;
      }
      if (field === 'media' && f.type.startsWith('video/')) {
        const url = URL.createObjectURL(f);
        return `<div class="attachment-card"><video class="attachment-thumb" src="${url}" muted></video><div class="uploading">Uploading…</div></div>`;
      }
      if (field === 'media') {
        return `<div class="attachment-card"><div>Audio: ${f.name}</div><div class="uploading">Uploading…</div></div>`;
      }
      return `<div class="attachment-card"><div>File: ${f.name}</div><div class="uploading">Uploading…</div></div>`;
    })
    .join('');
  const grid = `<div class="attachment-grid">${items}</div>`;
  const created = new Date().toLocaleString();
  el.innerHTML = `<div>${text || ''}</div>${grid}<div class="meta">${created} · uploading</div>`;
  els.messages.appendChild(el);
  els.messages.scrollTop = els.messages.scrollHeight;
  return el;
}