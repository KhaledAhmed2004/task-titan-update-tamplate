import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { jwtHelper } from './jwtHelper';
import config from '../config';
import { Message } from '../app/modules/message/message.model';
import {
  setOnline,
  setOffline,
  addUserRoom,
  removeUserRoom,
  updateLastActive,
  getUserRooms,
} from '../app/helpers/presenceHelper';

const USER_ROOM = (userId: string) => `user::${userId}`;
const CHAT_ROOM = (chatId: string) => `chat::${chatId}`;

const socket = (io: Server) => {
  io.on('connection', async socket => {
    try {
      const token =
        (socket.handshake.auth as any)?.token ||
        (socket.handshake.query as any)?.token;

      if (!token || typeof token !== 'string') {
        logger.warn(colors.yellow('Socket connection without token. Disconnecting.'));
        socket.disconnect(true);
        return;
      }

      let payload: any;
      try {
        payload = jwtHelper.verifyToken(token, config.jwt.jwt_secret as any);
      } catch (err) {
        logger.warn(colors.red('Invalid JWT on socket connection. Disconnecting.'));
        socket.disconnect(true);
        return;
      }

      const userId = payload?.id as string;
      if (!userId) {
        logger.warn(colors.red('JWT payload missing id. Disconnecting.'));
        socket.disconnect(true);
        return;
      }

      // Mark online and join personal room
      await setOnline(userId);
      await updateLastActive(userId);
      socket.join(USER_ROOM(userId));
      logger.info(colors.blue(`User ${userId} connected & joined ${USER_ROOM(userId)}`));
      logger.info(`🔔 Event processed: socket_connected for user_id: ${userId}`);

      // Join chat room
      socket.on('JOIN_CHAT', async ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        socket.join(CHAT_ROOM(chatId));
        await addUserRoom(userId, chatId);
        await updateLastActive(userId);
        // Broadcast presence to the chat room
        io.to(CHAT_ROOM(chatId)).emit('USER_ONLINE', { userId, chatId, lastActive: Date.now() });
        logger.info(colors.green(`User ${userId} joined chat room ${CHAT_ROOM(chatId)}`));
        logger.info(`🔔 Event processed: JOIN_CHAT for chat_id: ${chatId}`);
      });

      // Leave chat room
      socket.on('LEAVE_CHAT', async ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        socket.leave(CHAT_ROOM(chatId));
        await removeUserRoom(userId, chatId);
        await updateLastActive(userId);
        io.to(CHAT_ROOM(chatId)).emit('USER_OFFLINE', { userId, chatId, lastActive: Date.now() });
        logger.info(colors.yellow(`User ${userId} left chat room ${CHAT_ROOM(chatId)}`));
        logger.info(`🔔 Event processed: LEAVE_CHAT for chat_id: ${chatId}`);
      });

      // Typing indicators
      socket.on('TYPING_START', ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        io.to(CHAT_ROOM(chatId)).emit('TYPING_START', { userId, chatId });
        updateLastActive(userId).catch(() => {});
        logger.info(`🔔 Event processed: TYPING_START for chat_id: ${chatId}`);
      });
      socket.on('TYPING_STOP', ({ chatId }: { chatId: string }) => {
        if (!chatId) return;
        io.to(CHAT_ROOM(chatId)).emit('TYPING_STOP', { userId, chatId });
        updateLastActive(userId).catch(() => {});
        logger.info(`🔔 Event processed: TYPING_STOP for chat_id: ${chatId}`);
      });

      // Delivery acknowledgment
      socket.on('DELIVERED_ACK', async ({ messageId }: { messageId: string }) => {
        try {
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
            updateLastActive(userId).catch(() => {});
            logger.info(`🔔 Event processed: DELIVERED_ACK for message_id: ${String(msg._id)}`);
          }
        } catch (err) {
          logger.error(colors.red(`DELIVERED_ACK error: ${String(err)}`));
        }
      });

      // Read acknowledgment
      socket.on('READ_ACK', async ({ messageId }: { messageId: string }) => {
        try {
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
            updateLastActive(userId).catch(() => {});
            logger.info(`🔔 Event processed: READ_ACK for message_id: ${String(msg._id)}`);
          }
        } catch (err) {
          logger.error(colors.red(`READ_ACK error: ${String(err)}`));
        }
      });

      // Disconnect
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
        } catch {}
        logger.info(colors.red(`User ${userId} disconnected`));
        logger.info(`🔔 Event processed: socket_disconnected for user_id: ${userId}`);
      });
    } catch (err) {
      logger.error(colors.red(`Socket error on connection: ${String(err)}`));
      try {
        socket.disconnect(true);
      } catch {}
    }
  });
};

export const socketHelper = { socket };
