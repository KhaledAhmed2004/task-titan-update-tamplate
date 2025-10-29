import { SERVER_ORIGIN } from './config.js';

export const state = {
  token: localStorage.getItem('token') || '',
  currentUser: null,
  socket: null,
  currentChatId: null,
  typingTimer: null,
  TYPING_DEBOUNCE: 1200,
};

export const joinedChatIds = new Set();
export const renderedMessageIds = new Set();

export function decodeJWT(jwt) {
  try {
    const base64Url = jwt.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function setToken(t) {
  state.token = t || '';
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
  state.currentUser = t ? decodeJWT(t) : null;
}

export function setCurrentChat(chatId) {
  state.currentChatId = chatId || null;
}

export function clearAuth() {
  try { state.socket?.off(); state.socket?.disconnect(); } catch {}
  state.socket = null;
  setToken('');
  state.currentUser = null;
  state.currentChatId = null;
  joinedChatIds.clear();
  renderedMessageIds.clear();
}