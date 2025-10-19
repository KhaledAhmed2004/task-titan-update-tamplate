import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io, Socket } from 'socket.io-client';
import type { IncomingMessage } from 'http';
import {
  authenticateExistingTestUser,
  createAndAuthenticateTestUser,
  makeAuthenticatedRequest,
  getAuthHeader,
  TEST_USERS,
  TEST_TIMEOUTS,
  BACKEND_URL,
} from '../../helpers';

// Utility: wait for a single event with timeout
function waitForEvent<T = any>(socket: Socket, event: string, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler as any);
      reject(new Error(`Timeout waiting for event ${event}`));
    }, timeoutMs);
    const handler = (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    };
    socket.once(event, handler as any);
  });
}

// Utility: connect a socket client with JWT auth
async function connectClient(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const client = io(BACKEND_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
      timeout: 8000,
    });
    client.on('connect', () => resolve(client));
    client.on('connect_error', (err: any) => reject(err));
  });
}

// Extract `_id` from authenticated user's profile
async function getUserIdFromProfile(token: string): Promise<string> {
  const res = await makeAuthenticatedRequest('get', '/user/profile', token);
  expect(res.status).toBe(200);
  const { data } = res.body || {};
  expect(data?._id).toBeTruthy();
  return data._id;
}

// Create chat between two users and return chatId
async function createChat(token: string, otherUserId: string): Promise<string> {
  const res = await makeAuthenticatedRequest('post', `/chats/${otherUserId}`, token);
  expect(res.status).toBe(201);
  const { data } = res.body || {};
  expect(data?._id).toBeTruthy();
  return data._id;
}

// Send a plain text message via REST
async function sendMessage(token: string, chatId: string, text: string) {
  const res = await makeAuthenticatedRequest('post', `/messages`, token).send({ chatId, text });
  expect(res.status).toBe(201);
  const { data } = res.body || {};
  expect(data?._id).toBeTruthy();
  return data;
}

// Mark chat as read via REST
async function markChatRead(token: string, chatId: string) {
  const res = await makeAuthenticatedRequest('post', `/messages/chat/${chatId}/read`, token);
  expect(res.status).toBe(200);
  const { data } = res.body || {};
  return data;
}

// E2E: Presence + Receipts flow between two existing test users
// Assumptions: Backend server is running and accessible at BACKEND_URL.
//              Test users in TEST_USERS can authenticate successfully.
describe('Chat Presence & Receipts E2E', () => {
  vi.setConfig({ testTimeout: TEST_TIMEOUTS.LONG_RUNNING_TEST || 20000 });

  let posterToken: string;
  let taskerToken: string;
  let posterId: string;
  let taskerId: string;
  let chatId: string;
  let posterSocket: Socket;
  let taskerSocket: Socket;

  beforeAll(async () => {
    // Authenticate two pre-defined users
    const poster = await createAndAuthenticateTestUser(TEST_USERS.POSTER);
    const tasker = await createAndAuthenticateTestUser(TEST_USERS.TASKER1);
    posterToken = poster.token;
    taskerToken = tasker.token;

    // Resolve their real user IDs from profile endpoint
    posterId = await getUserIdFromProfile(posterToken);
    taskerId = await getUserIdFromProfile(taskerToken);

    // Create a chat from poster to tasker
    chatId = await createChat(posterToken, taskerId);

    // Connect both socket clients
    posterSocket = await connectClient(posterToken);
    taskerSocket = await connectClient(taskerToken);

    // Join the chat room from both ends
    posterSocket.emit('JOIN_CHAT', { chatId });
    taskerSocket.emit('JOIN_CHAT', { chatId });

    // Each side should observe the other coming online in the room
    const onlineFromPoster = await waitForEvent(posterSocket, 'USER_ONLINE');
    const onlineFromTasker = await waitForEvent(taskerSocket, 'USER_ONLINE');
    expect(onlineFromPoster?.userId).toBeTruthy();
    expect(onlineFromTasker?.userId).toBeTruthy();
  });

  afterAll(async () => {
    try {
      posterSocket?.emit('LEAVE_CHAT', { chatId });
      taskerSocket?.emit('LEAVE_CHAT', { chatId });
      posterSocket?.disconnect();
      taskerSocket?.disconnect();
    } catch {}
  });

  it('emits MESSAGE_SENT -> DELIVERED_ACK -> MESSAGE_DELIVERED -> MESSAGE_READ', async () => {
    // Send a message from poster to tasker
    const msg = await sendMessage(posterToken, chatId, 'Hello from E2E test');
    expect(msg.chatId).toBe(chatId);

    // Both should receive MESSAGE_SENT for the chat room
    const sentPoster = await waitForEvent(posterSocket, 'MESSAGE_SENT');
    const sentTasker = await waitForEvent(taskerSocket, 'MESSAGE_SENT');
    expect(sentPoster?.message?._id || sentPoster?._id).toBeTruthy();
    expect(sentTasker?.message?._id || sentTasker?._id).toBeTruthy();

    const messageId = sentTasker?.message?._id || sentTasker?._id || msg._id;
    expect(messageId).toBeTruthy();

    // Receiver emits delivered ack
    taskerSocket.emit('DELIVERED_ACK', { messageId, chatId });

    // Both should see MESSAGE_DELIVERED
    const deliveredPoster = await waitForEvent(posterSocket, 'MESSAGE_DELIVERED');
    const deliveredTasker = await waitForEvent(taskerSocket, 'MESSAGE_DELIVERED');
    expect(deliveredPoster?.messageId || deliveredPoster?.message?._id).toBeTruthy();
    expect(deliveredTasker?.messageId || deliveredTasker?.message?._id).toBeTruthy();

    // Receiver marks the chat as read via REST
    await markChatRead(taskerToken, chatId);

    // Both should see MESSAGE_READ
    const readPoster = await waitForEvent(posterSocket, 'MESSAGE_READ');
    const readTasker = await waitForEvent(taskerSocket, 'MESSAGE_READ');
    expect(readPoster?.messageId || readPoster?.message?._id).toBeTruthy();
    expect(readTasker?.messageId || readTasker?.message?._id).toBeTruthy();
  });

  it('emits USER_OFFLINE when a participant leaves/disconnects', async () => {
    // Disconnect tasker and expect poster to receive USER_OFFLINE
    taskerSocket.emit('LEAVE_CHAT', { chatId });
    taskerSocket.disconnect();

    const offlineEvent = await waitForEvent(posterSocket, 'USER_OFFLINE');
    expect(offlineEvent?.userId).toBeTruthy();
  });
});