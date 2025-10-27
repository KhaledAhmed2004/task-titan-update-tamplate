"use strict";
// import colors from 'colors';
// import { Server } from 'socket.io';
// import { logger } from '../shared/logger';
// import { jwtHelper } from './jwtHelper';
// import config from '../config';
// import { Message } from '../app/modules/message/message.model';
// import {
//   setOnline,
//   setOffline,
//   addUserRoom,
//   removeUserRoom,
//   updateLastActive,
//   getUserRooms,
// } from '../app/helpers/presenceHelper';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHelper = void 0;
// const USER_ROOM = (userId: string) => `user::${userId}`;
// const CHAT_ROOM = (chatId: string) => `chat::${chatId}`;
// const socket = (io: Server) => {
//   io.on('connection', async socket => {
//     try {
//       const token =
//         (socket.handshake.auth as any)?.token ||
//         (socket.handshake.query as any)?.token;
//       if (!token || typeof token !== 'string') {
//         logger.warn(colors.yellow('Socket connection without token. Disconnecting.'));
//         socket.disconnect(true);
//         return;
//       }
//       let payload: any;
//       try {
//         payload = jwtHelper.verifyToken(token, config.jwt.jwt_secret as any);
//       } catch (err) {
//         logger.warn(colors.red('Invalid JWT on socket connection. Disconnecting.'));
//         socket.disconnect(true);
//         return;
//       }
//       const userId = payload?.id as string;
//       if (!userId) {
//         logger.warn(colors.red('JWT payload missing id. Disconnecting.'));
//         socket.disconnect(true);
//         return;
//       }
//       // Mark online and join personal room
//       await setOnline(userId);
//       await updateLastActive(userId);
//       socket.join(USER_ROOM(userId));
//       logger.info(colors.blue(`User ${userId} connected & joined ${USER_ROOM(userId)}`));
//       logger.info(`🔔 Event processed: socket_connected for user_id: ${userId}`);
//       // Join chat room
//       socket.on('JOIN_CHAT', async ({ chatId }: { chatId: string }) => {
//         if (!chatId) return;
//         socket.join(CHAT_ROOM(chatId));
//         await addUserRoom(userId, chatId);
//         await updateLastActive(userId);
//         // Broadcast presence to the chat room
//         io.to(CHAT_ROOM(chatId)).emit('USER_ONLINE', { userId, chatId, lastActive: Date.now() });
//         logger.info(colors.green(`User ${userId} joined chat room ${CHAT_ROOM(chatId)}`));
//         logger.info(`🔔 Event processed: JOIN_CHAT for chat_id: ${chatId}`);
//       });
//       // Leave chat room
//       socket.on('LEAVE_CHAT', async ({ chatId }: { chatId: string }) => {
//         if (!chatId) return;
//         socket.leave(CHAT_ROOM(chatId));
//         await removeUserRoom(userId, chatId);
//         await updateLastActive(userId);
//         io.to(CHAT_ROOM(chatId)).emit('USER_OFFLINE', { userId, chatId, lastActive: Date.now() });
//         logger.info(colors.yellow(`User ${userId} left chat room ${CHAT_ROOM(chatId)}`));
//         logger.info(`🔔 Event processed: LEAVE_CHAT for chat_id: ${chatId}`);
//       });
//       // Typing indicators
//       socket.on('TYPING_START', ({ chatId }: { chatId: string }) => {
//         if (!chatId) return;
//         io.to(CHAT_ROOM(chatId)).emit('TYPING_START', { userId, chatId });
//         updateLastActive(userId).catch(() => {});
//         logger.info(`🔔 Event processed: TYPING_START for chat_id: ${chatId}`);
//       });
//       socket.on('TYPING_STOP', ({ chatId }: { chatId: string }) => {
//         if (!chatId) return;
//         io.to(CHAT_ROOM(chatId)).emit('TYPING_STOP', { userId, chatId });
//         updateLastActive(userId).catch(() => {});
//         logger.info(`🔔 Event processed: TYPING_STOP for chat_id: ${chatId}`);
//       });
//       // Delivery acknowledgment
//       socket.on('DELIVERED_ACK', async ({ messageId }: { messageId: string }) => {
//         try {
//           const msg = await Message.findByIdAndUpdate(
//             messageId,
//             { $addToSet: { deliveredTo: userId } },
//             { new: true }
//           );
//           if (msg) {
//             io.to(CHAT_ROOM(String(msg.chatId))).emit('MESSAGE_DELIVERED', {
//               messageId: String(msg._id),
//               chatId: String(msg.chatId),
//               userId,
//             });
//             updateLastActive(userId).catch(() => {});
//             logger.info(`🔔 Event processed: DELIVERED_ACK for message_id: ${String(msg._id)}`);
//           }
//         } catch (err) {
//           logger.error(colors.red(`DELIVERED_ACK error: ${String(err)}`));
//         }
//       });
//       // Read acknowledgment
//       socket.on('READ_ACK', async ({ messageId }: { messageId: string }) => {
//         try {
//           const msg = await Message.findByIdAndUpdate(
//             messageId,
//             { $addToSet: { readBy: userId } },
//             { new: true }
//           );
//           if (msg) {
//             io.to(CHAT_ROOM(String(msg.chatId))).emit('MESSAGE_READ', {
//               messageId: String(msg._id),
//               chatId: String(msg.chatId),
//               userId,
//             });
//             updateLastActive(userId).catch(() => {});
//             logger.info(`🔔 Event processed: READ_ACK for message_id: ${String(msg._id)}`);
//           }
//         } catch (err) {
//           logger.error(colors.red(`READ_ACK error: ${String(err)}`));
//         }
//       });
//       // Disconnect
//       socket.on('disconnect', async () => {
//         try {
//           await setOffline(userId);
//           await updateLastActive(userId);
//           // Notify all chat rooms this user participated in
//           try {
//             const rooms = await getUserRooms(userId);
//             for (const chatId of rooms || []) {
//               io.to(CHAT_ROOM(String(chatId))).emit('USER_OFFLINE', {
//                 userId,
//                 chatId: String(chatId),
//                 lastActive: Date.now(),
//               });
//             }
//           } catch {}
//         } catch {}
//         logger.info(colors.red(`User ${userId} disconnected`));
//         logger.info(`🔔 Event processed: socket_disconnected for user_id: ${userId}`);
//       });
//     } catch (err) {
//       logger.error(colors.red(`Socket error on connection: ${String(err)}`));
//       try {
//         socket.disconnect(true);
//       } catch {}
//     }
//   });
// };
// export const socketHelper = { socket };
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const jwtHelper_1 = require("./jwtHelper");
const config_1 = __importDefault(require("../config"));
const message_model_1 = require("../app/modules/message/message.model");
const presenceHelper_1 = require("../app/helpers/presenceHelper");
// -------------------------
// 🔹 Room Name Generators
// -------------------------
// USER_ROOM: unique private room for each user (for personal notifications)
// CHAT_ROOM: group room for each chat conversation
const USER_ROOM = (userId) => `user::${userId}`;
const CHAT_ROOM = (chatId) => `chat::${chatId}`;
// -------------------------
// 🔹 Main Socket Handler
// -------------------------
const socket = (io) => {
    io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            // -----------------------------
            // 🧩 STEP 1 — Authenticate Socket
            // -----------------------------
            const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ||
                ((_b = socket.handshake.query) === null || _b === void 0 ? void 0 : _b.token);
            if (!token || typeof token !== 'string') {
                logger_1.logger.warn(colors_1.default.yellow('Socket connection without token. Disconnecting.'));
                return socket.disconnect(true);
            }
            let payload;
            try {
                payload = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
            }
            catch (err) {
                logger_1.logger.warn(colors_1.default.red('Invalid JWT on socket connection. Disconnecting.'));
                return socket.disconnect(true);
            }
            const userId = payload === null || payload === void 0 ? void 0 : payload.id;
            if (!userId) {
                logger_1.logger.warn(colors_1.default.red('JWT payload missing id. Disconnecting.'));
                return socket.disconnect(true);
            }
            // -----------------------------
            // 🧩 STEP 2 — Mark Online & Join Personal Room
            // -----------------------------
            yield (0, presenceHelper_1.setOnline)(userId);
            yield (0, presenceHelper_1.updateLastActive)(userId);
            socket.join(USER_ROOM(userId)); // join user’s personal private room
            logger_1.logger.info(colors_1.default.blue(`✅ User ${userId} connected & joined ${USER_ROOM(userId)}`));
            logEvent('socket_connected', `for user_id: ${userId}`);
            // -----------------------------
            // 🔹 Helper Function: Simplify repetitive event logging & activity update
            // -----------------------------
            const handleEventProcessed = (event, extra) => {
                (0, presenceHelper_1.updateLastActive)(userId).catch(() => { });
                logEvent(event, extra);
            };
            // ---------------------------------------------
            // 🔹 Chat Room Join / Leave Events
            // ---------------------------------------------
            socket.on('JOIN_CHAT', (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId }) {
                if (!chatId)
                    return;
                socket.join(CHAT_ROOM(chatId));
                yield (0, presenceHelper_1.addUserRoom)(userId, chatId);
                handleEventProcessed('JOIN_CHAT', `for chat_id: ${chatId}`);
                // Broadcast to others in the chat that this user is now online
                io.to(CHAT_ROOM(chatId)).emit('USER_ONLINE', { userId, chatId, lastActive: Date.now() });
                logger_1.logger.info(colors_1.default.green(`User ${userId} joined chat room ${CHAT_ROOM(chatId)}`));
            }));
            socket.on('LEAVE_CHAT', (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId }) {
                if (!chatId)
                    return;
                socket.leave(CHAT_ROOM(chatId));
                yield (0, presenceHelper_1.removeUserRoom)(userId, chatId);
                handleEventProcessed('LEAVE_CHAT', `for chat_id: ${chatId}`);
                // Notify others that user went offline in this chat
                io.to(CHAT_ROOM(chatId)).emit('USER_OFFLINE', { userId, chatId, lastActive: Date.now() });
                logger_1.logger.info(colors_1.default.yellow(`User ${userId} left chat room ${CHAT_ROOM(chatId)}`));
            }));
            // ---------------------------------------------
            // 🔹 Typing Indicators
            // ---------------------------------------------
            socket.on('TYPING_START', ({ chatId }) => {
                if (!chatId)
                    return;
                io.to(CHAT_ROOM(chatId)).emit('TYPING_START', { userId, chatId });
                handleEventProcessed('TYPING_START', `for chat_id: ${chatId}`);
            });
            socket.on('TYPING_STOP', ({ chatId }) => {
                if (!chatId)
                    return;
                io.to(CHAT_ROOM(chatId)).emit('TYPING_STOP', { userId, chatId });
                handleEventProcessed('TYPING_STOP', `for chat_id: ${chatId}`);
            });
            // ---------------------------------------------
            // 🔹 Message Delivery & Read Acknowledgements
            // ---------------------------------------------
            socket.on('DELIVERED_ACK', (_a) => __awaiter(void 0, [_a], void 0, function* ({ messageId }) {
                try {
                    const msg = yield message_model_1.Message.findByIdAndUpdate(messageId, { $addToSet: { deliveredTo: userId } }, { new: true });
                    if (msg) {
                        io.to(CHAT_ROOM(String(msg.chatId))).emit('MESSAGE_DELIVERED', {
                            messageId: String(msg._id),
                            chatId: String(msg.chatId),
                            userId,
                        });
                        handleEventProcessed('DELIVERED_ACK', `for message_id: ${String(msg._id)}`);
                    }
                }
                catch (err) {
                    logger_1.logger.error(colors_1.default.red(`❌ DELIVERED_ACK error: ${String(err)}`));
                }
            }));
            socket.on('READ_ACK', (_a) => __awaiter(void 0, [_a], void 0, function* ({ messageId }) {
                try {
                    const msg = yield message_model_1.Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } }, { new: true });
                    if (msg) {
                        io.to(CHAT_ROOM(String(msg.chatId))).emit('MESSAGE_READ', {
                            messageId: String(msg._id),
                            chatId: String(msg.chatId),
                            userId,
                        });
                        handleEventProcessed('READ_ACK', `for message_id: ${String(msg._id)}`);
                    }
                }
                catch (err) {
                    logger_1.logger.error(colors_1.default.red(`❌ READ_ACK error: ${String(err)}`));
                }
            }));
            // ---------------------------------------------
            // 🔹 Handle Disconnect Event
            // ---------------------------------------------
            socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield (0, presenceHelper_1.setOffline)(userId);
                    yield (0, presenceHelper_1.updateLastActive)(userId);
                    // Notify all chat rooms this user participated in
                    try {
                        const rooms = yield (0, presenceHelper_1.getUserRooms)(userId);
                        for (const chatId of rooms || []) {
                            io.to(CHAT_ROOM(String(chatId))).emit('USER_OFFLINE', {
                                userId,
                                chatId: String(chatId),
                                lastActive: Date.now(),
                            });
                        }
                    }
                    catch (_a) { }
                    logger_1.logger.info(colors_1.default.red(`User ${userId} disconnected`));
                    logEvent('socket_disconnected', `for user_id: ${userId}`);
                }
                catch (err) {
                    logger_1.logger.error(colors_1.default.red(`❌ Disconnect handling error: ${String(err)}`));
                }
            }));
        }
        catch (err) {
            logger_1.logger.error(colors_1.default.red(`Socket connection error: ${String(err)}`));
            try {
                socket.disconnect(true);
            }
            catch (_c) { }
        }
    }));
};
// -------------------------
// 🔹 Helper: Log formatter
// -------------------------
const logEvent = (event, extra) => {
    logger_1.logger.info(`🔔 Event processed: ${event} ${extra || ''}`);
};
exports.socketHelper = { socket };
