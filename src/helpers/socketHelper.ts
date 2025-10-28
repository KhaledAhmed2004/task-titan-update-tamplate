import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { jwtHelper } from './jwtHelper';
import config from '../config';
import { Message } from '../app/modules/message/message.model';
import { Chat } from '../app/modules/chat/chat.model';
import { getRedisClient } from '../config/redis';
import {
  setOnline,
  setOffline,
  addUserRoom,
  removeUserRoom,
  updateLastActive,
  getUserRooms,
} from '../app/helpers/presenceHelper';

// -------------------------
// 🔹 Room Name Generators
// -------------------------
// USER_ROOM: unique private room for each user (for personal notifications)
// CHAT_ROOM: group room for each chat conversation
const USER_ROOM = (userId: string) => `user::${userId}`;
const CHAT_ROOM = (chatId: string) => `chat::${chatId}`;
const TYPING_KEY = (chatId: string, userId: string) => `typing:${chatId}:${userId}`;
const TYPING_TTL_SECONDS = 5; // throttle window

// -------------------------
// 🔹 Main Socket Handler
// -------------------------
const socket = (io: Server) => {
  io.on('connection', async socket => {
    try {
      // -----------------------------
      // 🧩 STEP 1 — Authenticate Socket
      // -----------------------------
      const token =
        (socket.handshake.auth as any)?.token ||
        (socket.handshake.query as any)?.token;

      if (!token || typeof token !== 'string') {
        logger.warn(
          colors.yellow('Socket connection without token. Disconnecting.')
        );
        return socket.disconnect(true);
      }

      let payload: any;
      try {
        payload = jwtHelper.verifyToken(token, config.jwt.jwt_secret as any);
      } catch (err) {
        logger.warn(
          colors.red('Invalid JWT on socket connection. Disconnecting.')
        );
        return socket.disconnect(true);
      }

      const userId = payload?.id as string;
      if (!userId) {
        logger.warn(colors.red('JWT payload missing id. Disconnecting.'));
        return socket.disconnect(true);
      }

      // -----------------------------
      // 🧩 STEP 2 — Mark Online & Join Personal Room
      // -----------------------------
      await setOnline(userId);
      await updateLastActive(userId);
      socket.join(USER_ROOM(userId)); // join user’s personal private room
      logger.info(
        colors.blue(`✅ User ${userId} connected & joined ${USER_ROOM(userId)}`)
      );
      logEvent('socket_connected', `for user_id: ${userId}`);

      // -----------------------------
      // 🔹 Helper Function: Simplify repetitive event logging & activity update
      // -----------------------------
      const handleEventProcessed = (event: string, extra?: string) => {
        updateLastActive(userId).catch(() => {});
        logEvent(event, extra);
      };

      // ---------------------------------------------
      // 🔹 Chat Room Join / Leave Events
      // ---------------------------------------------
      socket.on('JOIN_CHAT', async ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        socket.join(CHAT_ROOM(chatId));
        await addUserRoom(userId, chatId);
        handleEventProcessed('JOIN_CHAT', `for chat_id: ${chatId}`);

        // Broadcast to others in the chat that this user is now online
        io.to(CHAT_ROOM(chatId)).emit('USER_ONLINE', {
          userId,
          chatId,
          lastActive: Date.now(),
        });
        logger.info(
          colors.green(`User ${userId} joined chat room ${CHAT_ROOM(chatId)}`)
        );

        // Auto-mark undelivered messages as delivered for this user upon joining the chat.
        // This fixes cases where messages sent while the user was offline remain stuck at "sent"
        // after the user logs back in and rejoins rooms.
        try {
          const undelivered = await Message.find(
            {
              chatId,
              sender: { $ne: userId },
              deliveredTo: { $nin: [userId] },
            },
            { _id: 1 }
          );

          if (undelivered && undelivered.length > 0) {
            const ids = undelivered.map(m => m._id);
            await Message.updateMany(
              { _id: { $in: ids } },
              { $addToSet: { deliveredTo: userId } }
            );

            for (const msg of undelivered) {
              io.to(CHAT_ROOM(String(chatId))).emit('MESSAGE_DELIVERED', {
                messageId: String(msg._id),
                chatId: String(chatId),
                userId,
              });
            }

            logger.info(
              colors.green(
                `Auto-delivered ${
                  undelivered.length
                } pending messages for user ${userId} on join to ${CHAT_ROOM(
                  chatId
                )}`
              )
            );
            handleEventProcessed(
              'AUTO_DELIVERED_ON_JOIN',
              `count=${undelivered.length} chat_id=${chatId}`
            );
          }
        } catch (err) {
          logger.error(
            colors.red(`JOIN_CHAT auto deliver error: ${String(err)}`)
          );
        }
      });

      socket.on('LEAVE_CHAT', async ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        socket.leave(CHAT_ROOM(chatId));
        await removeUserRoom(userId, chatId);
        handleEventProcessed('LEAVE_CHAT', `for chat_id: ${chatId}`);

        // Notify others that user went offline in this chat
        io.to(CHAT_ROOM(chatId)).emit('USER_OFFLINE', {
          userId,
          chatId,
          lastActive: Date.now(),
        });
        logger.info(
          colors.yellow(`User ${userId} left chat room ${CHAT_ROOM(chatId)}`)
        );
      });

      // ---------------------------------------------
      // 🔹 Typing Indicators
      // ---------------------------------------------
      socket.on('TYPING_START', async ({ chatId }: { chatId: string }) => {
        if (!chatId) return;

        // Throttle typing events per user per chat using Redis TTL key
        try {
          const redis = getRedisClient();
          if (redis) {
            const key = TYPING_KEY(chatId, userId);
            // Emit only when key is absent; set key with short TTL to throttle
            const setRes = await (redis as any).set(key, '1', 'EX', TYPING_TTL_SECONDS, 'NX');
            if (!setRes) {
              // Key exists → skip emission to reduce noise
              handleEventProcessed('TYPING_START_THROTTLED_SKIP', `for chat_id: ${chatId}`);
              return;
            }
          }
        } catch {}

        io.to(CHAT_ROOM(chatId)).emit('TYPING_START', { userId, chatId });
        handleEventProcessed('TYPING_START', `for chat_id: ${chatId}`);
      });

      socket.on('TYPING_STOP', async ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        // Clear throttle key so next start can emit immediately
        try {
          const redis = getRedisClient();
          if (redis) {
            await (redis as any).del(TYPING_KEY(chatId, userId));
          }
        } catch {}

        io.to(CHAT_ROOM(chatId)).emit('TYPING_STOP', { userId, chatId });
        handleEventProcessed('TYPING_STOP', `for chat_id: ${chatId}`);
      });

      // ---------------------------------------------
      // 🔹 Message Delivery & Read Acknowledgements
      // ---------------------------------------------
      socket.on(
        'DELIVERED_ACK',
        async ({ messageId }: { messageId: string }) => {
          try {
            const found = await Message.findById(messageId).select('_id chatId');
            if (!found) {
              socket.emit('ACK_ERROR', {
                message: 'Message not found',
                messageId,
              });
              return;
            }

            const allowed = await Chat.exists({ _id: found.chatId, participants: userId });
            if (!allowed) {
              socket.emit('ACK_ERROR', {
                message: 'You are not a participant of this chat',
                chatId: String(found.chatId),
                messageId: String(found._id),
              });
              handleEventProcessed('DELIVERED_ACK_DENIED', `chat_id: ${String(found.chatId)}`);
              return;
            }

            const msg = await Message.findByIdAndUpdate(
              messageId,
              { $addToSet: { deliveredTo: userId } },
              { new: true }
            );
            if (msg) {
              io.to(CHAT_ROOM(String(msg.chatId))).emit('MESSAGE_DELIVERED', {
                messageId: String(msg._id),
                chatId: String(msg.chatId),
                userId,
              });
              handleEventProcessed(
                'DELIVERED_ACK',
                `for message_id: ${String(msg._id)}`
              );
            }
          } catch (err) {
            logger.error(colors.red(`❌ DELIVERED_ACK error: ${String(err)}`));
          }
        }
      );

      socket.on('READ_ACK', async ({ messageId }: { messageId: string }) => {
        try {
          const found = await Message.findById(messageId).select('_id chatId');
          if (!found) {
            socket.emit('ACK_ERROR', {
              message: 'Message not found',
              messageId,
            });
            return;
          }

          const allowed = await Chat.exists({ _id: found.chatId, participants: userId });
          if (!allowed) {
            socket.emit('ACK_ERROR', {
              message: 'You are not a participant of this chat',
              chatId: String(found.chatId),
              messageId: String(found._id),
            });
            handleEventProcessed('READ_ACK_DENIED', `chat_id: ${String(found.chatId)}`);
            return;
          }

          const msg = await Message.findByIdAndUpdate(
            messageId,
            { $addToSet: { readBy: userId } },
            { new: true }
          );
          if (msg) {
            io.to(CHAT_ROOM(String(msg.chatId))).emit('MESSAGE_READ', {
              messageId: String(msg._id),
              chatId: String(msg.chatId),
              userId,
            });
            handleEventProcessed(
              'READ_ACK',
              `for message_id: ${String(msg._id)}`
            );
          }
        } catch (err) {
          logger.error(colors.red(`❌ READ_ACK error: ${String(err)}`));
        }
      });

      // ---------------------------------------------
      // 🔹 Handle Disconnect Event
      // ---------------------------------------------
      socket.on('disconnect', async () => {
        try {
          await setOffline(userId);
          await updateLastActive(userId);

          // Notify all chat rooms this user participated in
          try {
            const rooms = await getUserRooms(userId);
            for (const chatId of rooms || []) {
              io.to(CHAT_ROOM(String(chatId))).emit('USER_OFFLINE', {
                userId,
                chatId: String(chatId),
                lastActive: Date.now(),
              });
            }
          } catch {}

          logger.info(colors.red(`User ${userId} disconnected`));
          logEvent('socket_disconnected', `for user_id: ${userId}`);
        } catch (err) {
          logger.error(
            colors.red(`❌ Disconnect handling error: ${String(err)}`)
          );
        }
      });
    } catch (err) {
      logger.error(colors.red(`Socket connection error: ${String(err)}`));
      try {
        socket.disconnect(true);
      } catch {}
    }
  });
};

// -------------------------
// 🔹 Helper: Log formatter
// -------------------------
const logEvent = (event: string, extra?: string) => {
  logger.info(`🔔 Event processed: ${event} ${extra || ''}`);
};

export const socketHelper = { socket };
