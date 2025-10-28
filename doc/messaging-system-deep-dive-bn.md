# Messaging System Deep Dive (Banglish)

Ei document-e Task Titans-er messaging system-ta full details-e, sohoj vabe bujhano hoyeche: keno, ki vabe, kon dependency, kon event kibhabe fire hoy, REST + Socket duitar interaction, presence/unread/typing, ebong UI receipts (sent/delivered/seen).

## Overview
- Real-time messaging with reliable receipts: `sent → delivered → seen`
- Presence: `USER_ONLINE`/`USER_OFFLINE`, `lastActive` update
- Typing indicator: `TYPING_START`/`TYPING_STOP`
- Unread count sync + bulk read
- Offline notification for receiver
- Scalable architecture: MongoDB + Redis + Socket.IO

## Architecture
- Backend: `Express` APIs (`src/app.ts`), `Socket.IO` server (`src/server.ts`), `socketHelper` (`src/helpers/socketHelper.ts`)
- Storage: `MongoDB` via Mongoose models — `Chat`, `Message`
- Cache/Presence: `Redis` (presence, future cache), see `src/config/redis.ts`
- Auth: `JWT` for both API and Socket (handshake `auth.token`)
- Frontend demo: `public/messaging-app.html` — room join, events, UI receipts

## Data Models
- `Chat`:
  - `participants: ObjectId(User)[]`
  - Recommended: timestamps, derived `lastMessage`, `unreadCount`
- `Message` (`src/app/modules/message/message.model.ts`):
  - `chatId: ObjectId(Chat)`
  - `sender: ObjectId(User)`
  - `text?: string`, `type: 'text'|'image'|'media'|'doc'|'mixed'`
  - `attachments?: { type: 'image'|'video'|'audio'|'file', url: string, name?: string }[]`
  - `deliveredTo: ObjectId[]`, `readBy: ObjectId[]`
  - `createdAt` timestamp

## Socket Rooms
- `user::<userId>` — personal room (optional for direct notifications)
- `chat::<chatId>` — conversation broadcast room

## Core Socket Events
- Room lifecycle:
  - `JOIN_CHAT: { chatId }` — join chat room
  - `LEAVE_CHAT: { chatId }` — leave chat room
  - Server emits presence:
    - `USER_ONLINE: { userId, chatId, lastActive }`
    - `USER_OFFLINE: { userId, chatId, lastActive }`
- Typing:
  - `TYPING_START: { chatId }` → broadcast `TYPING_START`
  - `TYPING_STOP: { chatId }` → broadcast `TYPING_STOP`
- Messaging:
  - Server → `MESSAGE_SENT: { messageId, chatId, sender, text, type, attachments, createdAt }`
  - Client (receiver) → `DELIVERED_ACK: { messageId }`
  - Server → `MESSAGE_DELIVERED: { messageId, chatId, userId }`
  - Client (reader) → `READ_ACK: { messageId }` (optional per-message)
  - Server → `MESSAGE_READ: { messageId, chatId, userId }`

## REST API Endpoints
- `POST /messages` — send message with optional files
  - Body: `{ chatId, text?, attachments? }`
  - Files: `image[]`, `media[]`, `doc[]` — auto-mapped to `attachments`
  - Auth: JWT required; server sets `sender` from token
  - Emits: `MESSAGE_SENT`
- `GET /messages/:id` — get messages in a chat
  - `id = chatId`
  - Query: `page`, `limit`, `sort`, `search`
  - Returns: `{ messages, pagination, participant }`
- `POST /messages/chat/:chatId/read` — bulk mark chat as read
  - Marks all messages (sender ≠ me, unread) as read for me
  - Emits `MESSAGE_READ` for each updated message

## End-to-End Flow (Sent → Delivered → Seen)
1) Send
- Client calls `POST /messages` with `{ chatId, text | attachments }`
- Server persists and emits `MESSAGE_SENT` to `chat::<chatId>`
- Sender UI shows `sent` (optimistic)

2) Delivered
- Receiver’s client gets `MESSAGE_SENT` and immediately emits `DELIVERED_ACK: { messageId }`
- Server updates `deliveredTo += receiverId` and emits `MESSAGE_DELIVERED`
- Sender UI updates `delivered`

3) Seen
- Reader opens thread or calls bulk `POST /messages/chat/:chatId/read`
- Server updates `readBy += readerId` and emits `MESSAGE_READ`
- Sender UI updates `seen`

## Catch‑up Delivery on Join (Offline → Online)
- Problem: Receiver offline thakle `DELIVERED_ACK` fire hoyna, sender UI `sent` e stuck.
- Fix (server): `JOIN_CHAT` er vitore auto-delivery logic add kora hoyeche — user join korlei server undelivered messages mark kore `deliveredTo += userId` and `MESSAGE_DELIVERED` emit kore.
- Result: Logout por e abar login kore room join korlei `sent → delivered` progress hoye jabe, thread open na korleo.

Implementation reference: `src/helpers/socketHelper.ts` → `JOIN_CHAT` handler auto‑delivery block.

## Presence Lifecycle
- On connect:
  - JWT verify; mark `setOnline(userId)`; join `user::<id>`
  - Update `lastActive`
- On `JOIN_CHAT`:
  - Join `chat::<chatId>`
  - Broadcast `USER_ONLINE`
- On `LEAVE_CHAT` or disconnect:
  - Leave room; broadcast `USER_OFFLINE`
  - Update `lastActive`

## Typing Indicator
- Client emits `TYPING_START`/`TYPING_STOP` with `{ chatId }`
- Server broadcasts same event to room
- UI: show inline indicator with debounce + TTL (e.g., 5s)

## Unread Count Strategy
- Bulk read via `POST /messages/chat/:chatId/read` updates `readBy`
- Unread count = messages where `sender ≠ me` and `readBy ∌ me`
- Inbox badge update when `MESSAGE_SENT`/`MESSAGE_READ` arrives

## Frontend UI (messaging-app.html)
- Room join: inbox load e `JOIN_CHAT` emit kore sob chats join korun
- Receipts:
  - My messages: status label shows `sent` / `delivered` / `seen`
  - `MESSAGE_DELIVERED` ashlei bubble update
  - `MESSAGE_READ` ashlei bubble update
- Receiver side:
  - `MESSAGE_SENT` receive korle immediately `DELIVERED_ACK` emit
  - Thread open korle bulk read API call

## Error Handling & Idempotency
- All receipt updates use `$addToSet` — duplicate prevent
- Out-of-order events safe dorkar-e UI state derive from `readBy`/`deliveredTo`
- Invalid JWT on socket → disconnect
- Invalid IDs → `400 Bad Request`

## Dependencies & Config
- `MongoDB`: durable chat/message storage
- `Redis`: presence + future scaling; see `REDIS_SETUP_GUIDE_BN.md`
- `Socket.IO`: real-time rooms/events; client connects with `auth.token`
- `JWT`: provided by API login; same token use for sockets
- `config.port`, `config.ip_address` — server listen; see `src/server.ts`

## Testing & Verification
- Integration test: `tests/integration/chat/chat.e2e.test.ts`
  - Flow covered: socket auth, room join, send → delivered → read
  - Bulk read via `POST /messages/chat/:chatId/read`
- Manual checks:
  - Sender sends; receiver online/offline; verify `sent → delivered → seen`
  - Logout/login catch‑up delivery validates `JOIN_CHAT` auto-delivery

## Troubleshooting
- `sent` stuck:
  - Ensure receiver joins rooms (`JOIN_CHAT` called for chats)
  - Check backend logs for `AUTO_DELIVERED_ON_JOIN` events
  - Verify `MESSAGE_DELIVERED` broadcasts reaching sender
- `seen` stuck:
  - Check bulk read call when thread opens
  - Verify `MESSAGE_READ` emissions
- Presence not updating:
  - Confirm socket auth token valid
  - Redis connectivity (see guide)

## FAQ
- Q: Group chat receipts kibhabe? — `deliveredTo`/`readBy` arrays e per-user track hoy; UI per-participant receipts render kora jay.
- Q: Multi-device? — Multiple sockets per user; backend dedupe by `userId`.
- Q: Offline notification? — `sendMessageToDB` te receiver offline hole in-app notification create hoy.

---

Ei guide follow korle end-to-end messaging system ta bujhte, debug korte, ebong extend korte parben — receipts, presence, unread, typing sob clear path e.