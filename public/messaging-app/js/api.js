import { API_BASE } from './config.js';
import { state } from './store.js';

export async function api(path, method = 'get', body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const res = await fetch(API_BASE + path, {
    method: method.toUpperCase(),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || ('HTTP ' + res.status));
    // @ts-ignore
    err.status = res.status;
    throw err;
  }
  return json;
}

export async function login(email, password) {
  const res = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
  return data?.data || '';
}

export const getChats = () => api('/chats/', 'get');
export const getMessages = chatId => api(`/messages/${chatId}`, 'get');
export const markChatRead = chatId => api(`/messages/chat/${chatId}/read`, 'post');
export const sendText = (chatId, text) => api('/messages', 'post', { chatId, text });

export async function uploadAttachments(chatId, files, text, tokenOverride) {
  const form = new FormData();
  form.append('chatId', chatId);
  if (text) form.append('text', text);
  Array.from(files).forEach(file => {
    const t = file.type || '';
    const field = t.startsWith('image/')
      ? 'image'
      : t.startsWith('video/') || t.startsWith('audio/')
      ? 'media'
      : 'doc';
    form.append(field, file);
  });
  const res = await fetch(API_BASE + '/messages', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (tokenOverride || state.token || '') },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || ('HTTP ' + res.status));
  return json?.data;
}