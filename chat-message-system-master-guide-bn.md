# Chat/Message System Master Guide (Banglish)

Ei document-e Task Titans-er chat/message system fully industry-standard korte end-to-end plan, rationale, flows, data models, sockets, Redis presence, receipts, unread counts, typing indicator, notifications sob kichu explain kora hoyeche — keno, ki vabe, and scratch theke kibhabe implement korte hobe.

## Goals & Scope
- Real-time messaging with reliable delivery and read receipts
- Presence: user online/offline, `lastActive`
- Message states: `sent → delivered → seen`
- Unread counts per chat per user
- Typing indicator
- Offline notifications (push/in-app)
- Secure socket auth, rate limiting, privacy
- Performant architecture using MongoDB + Redis + Socket.IO

## Tech Stack & Components
- `MongoDB`: Durable storage for Chat and Message history
- `Redis (ioredis)`: Fast presence + ephemeral receipts/unread cache
- `Socket.IO`: Realtime events, acks, rooms (`user::<id>`, `chat::<id>`)
- `Express` APIs: REST endpoints for read, list, pagination
- `JWT`: Socket and API authentication

## Data Models (Current vs Recommended)

### Chat (current)
```
participants: [ObjectId(User)]
status: Boolean
```
Recommended adjustments:
- Enable timestamps: `createdAt`, `updatedAt`
- Derived fields (not stored): `lastMessage`, `unreadCount`, `participantPresence`

### Message (current)
```
chatId: ObjectId(Chat)
sender: ObjectId(User)
text?: string
type: 'text'|'image'|'media'|'doc'|'mixed'
images?: string[]
media?: string[]
docs?: string[]
 timestamps
```
Recommended additions:
- `deliveredTo: ObjectId[]` — unique list of recipients who received
- `readBy: ObjectId[]` — unique list of recipients who read
- `editedAt?: Date`
Indexes:
- `{ chatId: 1, createdAt: -1 }`
- `{ sender: 1, createdAt: -1 }`

## Redis Schema (Presence & Receipts)
- `presence:online_users` (Set): `userId`s currently online
- `presence:last_active` (Hash): `{ userId: ISODateString }`
- `presence:user_sockets:<userId>` (Set): socketId list for multi-device
- Optional caches:
  - `msg:delivered:<messageId>` (Set): userIds
  - `msg:read:<messageId>` (Set): userIds
  - `chat:unread_count:<chatId>` (Hash): `{ userId: count }`

## Socket Rooms & Events
Rooms:
- `user::<userId>` — targeted events per user
- `chat::<chatId>` — conversation broadcasts

Core Events:
- `MESSAGE_SENT`, `MESSAGE_DELIVERED`, `MESSAGE_READ`
- `USER_TYPING` (`TYPING_START`, `TYPING_STOP`)
- `USER_ONLINE`, `USER_OFFLINE`

Ack Strategy:
- Client emits event with `ackId`
- Server responds with `messageId` + status
- Delivery ack from receiver triggers `deliveredTo` updates

## REST APIs (Complementary)
- `POST /api/messages/:id/read` → mark single message read
- `POST /api/chats/:chatId/read` → mark chat read (bulk)
- `GET /api/chats` → list with `lastMessage`, `unreadCount`, `isOnline`, `lastActive`
- `GET /api/chats/:id/messages` → messages with receipts, pagination

## End-to-End Flows (Why & How)

### 1) Presence Lifecycle
Why: Show availability, reduce friction, boost response rates.
How:
- On socket connect (JWT verified):
  - Add `socket.id` to `presence:user_sockets:<userId>`
  - Add `userId` to `presence:online_users`
  - Update `presence:last_active[userId] = now`
  - Emit `USER_ONLINE` to relevant `chat::<id>` rooms
- On disconnect:
  - Remove `socket.id` from `presence:user_sockets:<userId>`
  - If no sockets left for user → remove from `online_users`, set `last_active=now`, emit `USER_OFFLINE`
- API/Service can query Redis to decorate chat list with `isOnline`, `lastActive`

### 2) Send Message → Delivered → Seen
Why: Trust and clarity for users; standard UX (single tick, double tick, blue ticks).
How:
- Send:
  - Client emits `MESSAGE_SEND` with `chatId`, content
  - Server validates sender ∈ chat, persists `Message`
  - Server emits `MESSAGE_SENT` to `chat::<chatId>` (includes `messageId`)
  - If receiver offline → create notification (in-app/push)
- Delivered:
  - Receiver’s socket receives `MESSAGE_SENT` and returns `DELIVERED_ACK`
  - Server updates `deliveredTo` (dedupe by `userId`) and emits `MESSAGE_DELIVERED`
- Seen (Read):
  - When user opens chat or marks read via API/socket `READ_ACK`
  - Server updates `readBy` (dedupe) and emits `MESSAGE_READ`

### 3) Unread Count
Why: Engagement signals; users quickly see new updates.
How:
- Unread for `userX` in `chatId` = count of messages where `sender != userX` AND `userX ∉ readBy`
- Compute via Mongo aggregate per chat; optionally cache in Redis for fast list rendering
- On send → increment unread for other participant
- On read → decrement/unset unread for reader

### 4) Typing Indicator
Why: Conversational feedback.
How:
- Client emits `TYPING_START/TYPING_STOP` with `chatId`
- Server broadcast `USER_TYPING` to `chat::<chatId>` with `userId`
- Debounce on client; set TTL for `typing` state (e.g., 5s)

### 5) Offline Notifications
Why: Ensure users get notified even when not connected.
How:
- On `MESSAGE_SENT`: check `receiverId` online status from Redis
- If offline: create notification (`type=MESSAGE`), send push/in-app
- Respect user preferences and quiet hours (if configured)

## Security & Privacy
- Socket JWT auth on connect; disconnect invalid tokens
- Authorize events: only chat participants can send/receive
- Rate limit message/typing events to prevent spam
- Block list: prevent messaging and presence visibility if blocked
- Sanitize text, validate file uploads, enforce size limits

## Performance & Reliability
- Use rooms to avoid global broadcasts
- Acks to confirm delivery; retry if missed
- Indexes on `Message` for fast queries
- Redis for presence and hot-path counters
- Cursor-based pagination in `GET /messages`

## Implementation Steps (From Scratch)
1. Models
   - Add `timestamps` to `Chat`
   - Add `deliveredTo`, `readBy`, `editedAt` to `Message`
   - Create indexes
2. Redis Presence Service
   - Helpers: `setOnline(userId)`, `setOffline(userId)`, `updateLastActive(userId)`, `getPresence(userIds)`
3. Socket Layer
   - JWT verify on connection
   - Join `user::<userId>`
   - Event handlers: `MESSAGE_SEND` → save + emit; `DELIVERED_ACK` → update+emit; `READ_ACK` → update+emit; `TYPING_START/STOP` → broadcast
   - Disconnect → presence cleanup
4. Message Service
   - `sendMessageToDB(payload)` → persist, emit, offline notify
   - `markAsDelivered(messageId, userId)`
   - `markAsRead(messageId, userId)` & `markChatAsRead(chatId, userId)`
   - `getMessageFromDB(user, chatId, query)` → include receipts
5. Chat Service
   - `getChatFromDB(user, search)` → include `lastMessage`, `unreadCount`, `participantPresence`
6. APIs
   - `POST /messages/:id/read`, `POST /chats/:chatId/read`
   - Extend `GET /chats`, `GET /chats/:id/messages`
7. Notifications
   - Integrate `NotificationService.sendMessageNotification(...)` for offline users

## Example Payloads & Events
- `MESSAGE_SEND` (client → server):
```
{
  ackId: "uuid",
  chatId: "<id>",
  text: "Hello",
  type: "text",
  images: []
}
```
- `MESSAGE_SENT` (server → clients):
```
{
  messageId: "<id>",
  chatId: "<id>",
  sender: "<userId>",
  text: "Hello",
  type: "text",
  createdAt: "..."
}
```
- `DELIVERED_ACK`:
```
{ messageId: "<id>", userId: "<receiverId>" }
```
- `MESSAGE_DELIVERED`:
```
{ messageId: "<id>", deliveredTo: ["<receiverId>"] }
```
- `READ_ACK`:
```
{ messageId: "<id>", userId: "<readerId>" }
```
- `MESSAGE_READ`:
```
{ messageId: "<id>", readBy: ["<readerId>"] }
```

## Edge Cases
- Multi-device: multiple sockets per user; dedupe by `userId`
- Out-of-order events: rely on timestamps; idempotent updates
- Message deletion: update counts and notify clients
- Offline reads via REST: reconcile receipts and unread counts
- Blocked users: deny events and hide presence
- Large media: upload failures; transactional UX messaging

## Testing Plan
- Unit: presence helpers, receipt transitions
- Integration: socket auth, room join, send→deliver→read
- E2E: multi-device sync, offline notification, unread counters
- Performance: load test socket fanout, Redis throughput, Mongo aggregations

## Deployment & Config
- `REDIS_URL` required (defaults to `redis://localhost:6379`)
- Scale socket servers with sticky sessions or Redis adapter
- Monitor: socket connection counts, message throughput, error rates

## Rollout Strategy
1) Ship model changes + socket auth + presence
2) Add delivery/read receipts + unread counts
3) Add typing indicator
4) Integrate offline notifications
5) UI updates (ticks, badges, presence)
6) Observe metrics, refine edge cases

## Why This Design Works
- Separation of concerns: Mongo (durable), Redis (fast ephemeral), Socket.IO (events)
- Industry-standard UX: presence, ticks, unread
- Scales horizontally: rooms + Redis adapter
- Secure & privacy-aware: JWT, authorization, rate limits

---
If implementation start korte chao, ami targeted patches (models/services/sockets) add kore dite pari step-by-step. Ei guide follow korlei complete, reliable, production-grade messaging experience peye jabe.

---

## Implementation Status (Backend in this Repo)
- Chat model: timestamps enabled (`createdAt`, `updatedAt`) in `src/app/modules/chat/chat.model.ts`.
- Message model: `deliveredTo`, `readBy`, `editedAt` fields + indexes in `src/app/modules/message/message.model.ts`; interface updated in `message.interface.ts`.
- Redis Presence Helper: `src/app/helpers/presenceHelper.ts` add kora hoyeche with `setOnline`, `setOffline`, `updateLastActive`, `isOnline`, `getLastActive`, `addUserSocket`, `removeUserSocket`, `addUserRoom`, `removeUserRoom`, `getUserRooms`.
- Socket Layer: `src/helpers/socketHelper.ts` enhance kora — JWT verify on connect, user room join (`user::<id>`), `JOIN_CHAT`/`LEAVE_CHAT`, `TYPING_START/STOP`, `MESSAGE_SENT` delivery/read acks handle, presence broadcast.
- Message Service & APIs:
  - Service: `src/app/modules/message/message.service.ts` e `sendMessageToDB`, `markAsDelivered`, `markAsReadMessage`, `markChatAsRead`, `getUnreadCount`.
  - Controller: `message.controller.ts` e `markMessageRead`, `markChatRead` add.
  - Routes: `message.route.ts` e `POST /messages/:id/read`, `POST /messages/chat/:chatId/read` add.
- Chat Service: `src/app/modules/chat/chat.service.ts` e chat list enrich kora hoyeche with `lastMessage`, `unreadCount`, `presence { isOnline, lastActive }`.

## Full Flow (Code-level E2E)
- Connect (socket):
  - Client `auth.token` diye connect kore → server JWT verify.
  - Server: `setOnline(userId)`, `updateLastActive(userId)`, `socket.join('user::<userId>')`, relevant rooms-e `USER_ONLINE` broadcast.
- Send Message:
  - Client `MESSAGE_SEND` emit kore `chatId`, content.
  - Server validate + persist (`sendMessageToDB`) → emit `MESSAGE_SENT` to `chat::<chatId>`.
  - Receiver offline hole notification enqueue (see Notifications section).
- Delivered:
  - Receiver `DELIVERED_ACK` pathale server `markAsDelivered(messageId, userId)` update kore → `MESSAGE_DELIVERED` broadcast.
- Read (Seen):
  - API: `POST /messages/:id/read` or `POST /chats/:chatId/read` → `markAsReadMessage`/`markChatAsRead`.
  - Socket: `READ_ACK` handle kore server `readBy` update → `MESSAGE_READ` broadcast.
- Unread Counts:
  - List fetch e Mongo count: messages where `sender != you` AND `you ∉ readBy`.
  - Read korle decrement; send korle other participant er unread increment.
- Typing:
  - Client `TYPING_START/STOP` → server `USER_TYPING` broadcast to `chat::<chatId>`.
- Presence:
  - `isOnline` + `lastActive` Redis theke; disconnect hole cleanup + `USER_OFFLINE`.

## Frontend Integration (Step-by-Step)
- Authenticated Socket Connect:
  - `socket.io-client` diye connect: `io(API_URL, { auth: { token } })`.
  - `JOIN_CHAT` emit kore per chat: `{ chatId }`. Leave e `LEAVE_CHAT`.
- Chat List (Inbox):
  - API: `GET /api/chats` → pratyek chat e `lastMessage`, `unreadCount`, `presence { isOnline, lastActive }` pai.
  - UI: 
    - Unread badge: `unreadCount > 0` hole badge show (e.g., blue circle with count).
    - Presence dot: `isOnline === true` hole green dot; na hole grey dot + tooltip "Last active: <relative time>".
- Conversation Screen:
  - API: `GET /api/messages?chatId=<id>` → receipts sah message list.
  - Socket Events:
    - `MESSAGE_SENT`: new message ashle render; jodi `sender !== me` tahole `DELIVERED_ACK` emit kore dao.
    - `MESSAGE_DELIVERED`: message state double-tick kore update.
    - `MESSAGE_READ`: blue-tick kore update.
    - `USER_TYPING`: header/inline typing indicator show (debounce+TTL client side).
  - Read Actions:
    - Screen open e `POST /api/chats/:chatId/read` call kore bulk read; or per-message `POST /api/messages/:id/read`.
  - Ticks UX (WhatsApp-like):
    - Single tick: local send success.
    - Double tick: `deliveredTo` te receiver ashle.
    - Blue ticks: `readBy` te receiver ashle.
- State Sync:
  - `MESSAGE_SENT` ashle inbox e specific chat er `unreadCount` ++ (if current user != sender && not on chat screen).
  - `MESSAGE_READ` ashle unread badge decrement/clear for that chat.
- Error & Retry:
  - Socket disconnect → banner "Reconnecting…"; exponential backoff.
  - Ack timeouts → resend `DELIVERED_ACK`/`READ_ACK` idempotently.

### Why These Steps Matter (Frontend)
- Unread badge communicates new activity at a glance; drives engagement.
- Presence dot reduces uncertainty; users know if replies are likely.
- Acks ensure trust — users see delivery and seen states reliably.
- Bulk read API avoids per-message overhead; fast UX when opening chat.
- Typing indicator adds conversational feel; improves responsiveness.

### Minimal Frontend Snippet (Illustrative)
```ts
import { io } from 'socket.io-client';

const socket = io(process.env.API_URL!, { auth: { token: userToken } });

socket.on('connect', () => {
  socket.emit('JOIN_CHAT', { chatId });
});

socket.on('MESSAGE_SENT', (msg) => {
  renderMessage(msg);
  if (msg.sender !== myId) {
    socket.emit('DELIVERED_ACK', { messageId: msg.messageId, userId: myId });
  }
});

// Mark chat read when user opens the thread
fetch(`/api/messages/chat/${chatId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${userToken}` } });
```

## Notifications (Offline → Push/In-app)
- Backend Trigger Points:
  - `sendMessageToDB` por-e receiver online check: `isOnline(receiverId)`.
  - Offline hole: `NotificationService.sendMessageNotification({ to: receiverId, chatId, messagePreview })` call.
- Providers:
  - FCM (Firebase) or Expo push — credentials `.env`/config e rakhun.
- Frontend Tasks:
  - User push token collect & backend e register.
  - In-app notification badge update if socket offline.

### Implementation Status (Notifications)
- Backend wired to trigger notifications when receiver is offline.
- Location: `src/app/modules/message/message.service.ts` → after `MESSAGE_SENT`, checks presence and calls `sendNotifications`.
- Uses: `src/app/modules/notification/notificationsHelper.ts` (FCM via `pushNotificationHelper`).
- Config: set `FIREBASE_API_KEY_BASE64`/`firebase_api_key_base64` in `.env` to initialize Firebase.

## Debugging & Testing Checklist
- Redis Presence:
  - Keys: `presence:online_users` (Set), `presence:last_active` (Hash).
  - Verify `isOnline(userId)` true/false expected vabe change hocche.
- Socket Auth:
  - JWT missing/invalid hole server disconnect kore — browser console/log check.
  - Rooms: `JOIN_CHAT`/`LEAVE_CHAT` emit hocche kina; message events ki `chat::<id>` e asche kina.
- Receipts:
  - Two devices e test: sender/receiver; `MESSAGE_SENT` → `DELIVERED_ACK` → `READ_ACK` transitions.
- APIs:
  - `POST /api/messages/:id/read` → single message blue-tick.
  - `POST /api/chats/:chatId/read` → bulk blue-tick + inbox unread clear.
- Common Pitfalls:
  - Participant not in chat → server reject; ensure authorization.
  - File upload size/type invalid → validate before send.
  - Push tokens missing → device won’t receive notifications; register tokens first.
  - Firebase config invalid → server logs error; verify base64 key.

## Quick API Reference (Used in Frontend)
- `GET /api/chats` → list with `lastMessage`, `unreadCount`, `presence`.
- `GET /api/chats/:id/messages` → message history with receipts.
- `POST /api/messages/:id/read` → mark single read.
- `POST /api/chats/:chatId/read` → mark chat read.
- Socket Events: `MESSAGE_SEND`, `MESSAGE_SENT`, `DELIVERED_ACK`, `MESSAGE_DELIVERED`, `READ_ACK`, `MESSAGE_READ`, `TYPING_START`, `TYPING_STOP`, `USER_TYPING`, `USER_ONLINE`, `USER_OFFLINE`.

### Why These APIs/Events
- Separate responsibilities: sockets for realtime, REST for reliable state changes.
- Read endpoints make state durable; acks keep realtime consistent.

## Frontend UI Tasks (Action List)
- Add unread badge in chat list using `unreadCount`.
- Show green dot for `isOnline`; grey dot with relative `lastActive`.
- Implement ticks in message bubbles (single/double/blue).
- Add typing indicator with debounce + 5s TTL.
- Call `read` APIs on thread open; send `DELIVERED_ACK` on receive.
- Handle reconnect + optimistic UI updates.

### Why This UI
- Clear badges, presence, and ticks mirror familiar messaging apps; lowers cognitive load.

## Backend Tasks (Action List)
- Ensure Redis configured (`REDIS_URL`) and reachable.
- Socket auth strict: disconnect on invalid JWT.
- Rate-limit message/typing emits.
- Integrate push provider and wire offline notifications in `sendMessageToDB`.

### Why This Backend Setup
- Presence via Redis scales and avoids DB hot paths.
- Roomed sockets minimize fanout; efficient and secure.
- Push notifications bridge realtime gaps when users are offline.

---

Ei additions-er maddhome backend-e ki ki kora hoyeche, full flow, and frontend-e ki ki korte hobe — sob kichu ek jaygay thaklo. Ekhon UI te unread badge + presence dot add korlei complete messaging UX ready hobe. Push notifications chai le provider keys diye notification service plug-in kore dibo.