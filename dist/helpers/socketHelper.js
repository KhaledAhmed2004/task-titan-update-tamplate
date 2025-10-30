"use strict";
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
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const jwtHelper_1 = require("./jwtHelper");
const config_1 = __importDefault(require("../config"));
const message_model_1 = require("../app/modules/message/message.model");
const chat_model_1 = require("../app/modules/chat/chat.model");
const redis_1 = require("../config/redis");
const presenceHelper_1 = require("../app/helpers/presenceHelper");
// -------------------------
// 🔹 Room Name Generators
// -------------------------
// USER_ROOM: unique private room for each user (for personal notifications)
// CHAT_ROOM: group room for each chat conversation
const USER_ROOM = (userId) => `user::${userId}`;
const CHAT_ROOM = (chatId) => `chat::${chatId}`;
const TYPING_KEY = (chatId, userId) => `typing:${chatId}:${userId}`;
const TYPING_TTL_SECONDS = 5; // throttle window
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
            yield (0, presenceHelper_1.incrConnCount)(userId);
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
                // Security: Ensure only chat participants can join the room
                const allowed = yield chat_model_1.Chat.exists({ _id: chatId, participants: userId });
                if (!allowed) {
                    socket.emit('ACK_ERROR', {
                        message: 'You are not a participant of this chat',
                        chatId: String(chatId),
                    });
                    handleEventProcessed('JOIN_CHAT_DENIED', `for chat_id: ${chatId}`);
                    return;
                }
                socket.join(CHAT_ROOM(chatId));
                yield (0, presenceHelper_1.addUserRoom)(userId, chatId);
                handleEventProcessed('JOIN_CHAT', `for chat_id: ${chatId}`);
                // Broadcast to others in the chat that this user is now online
                const lastActive = yield (0, presenceHelper_1.getLastActive)(userId);
                io.to(CHAT_ROOM(chatId)).emit('USER_ONLINE', {
                    userId,
                    chatId,
                    lastActive,
                });
                logger_1.logger.info(colors_1.default.green(`User ${userId} joined chat room ${CHAT_ROOM(chatId)}`));
                // Auto-mark undelivered messages as delivered for this user upon joining the chat.
                // This fixes cases where messages sent while the user was offline remain stuck at "sent"
                // after the user logs back in and rejoins rooms.
                try {
                    const undelivered = yield message_model_1.Message.find({
                        chatId,
                        sender: { $ne: userId },
                        deliveredTo: { $nin: [userId] },
                    }, { _id: 1 });
                    if (undelivered && undelivered.length > 0) {
                        const ids = undelivered.map(m => m._id);
                        yield message_model_1.Message.updateMany({ _id: { $in: ids } }, { $addToSet: { deliveredTo: userId } });
                        for (const msg of undelivered) {
                            io.to(CHAT_ROOM(String(chatId))).emit('MESSAGE_DELIVERED', {
                                messageId: String(msg._id),
                                chatId: String(chatId),
                                userId,
                            });
                        }
                        logger_1.logger.info(colors_1.default.green(`Auto-delivered ${undelivered.length} pending messages for user ${userId} on join to ${CHAT_ROOM(chatId)}`));
                        handleEventProcessed('AUTO_DELIVERED_ON_JOIN', `count=${undelivered.length} chat_id=${chatId}`);
                    }
                }
                catch (err) {
                    logger_1.logger.error(colors_1.default.red(`JOIN_CHAT auto deliver error: ${String(err)}`));
                }
            }));
            socket.on('LEAVE_CHAT', (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId }) {
                if (!chatId)
                    return;
                // Guard: Ensure only participants can leave (consistency & logging)
                const allowed = yield chat_model_1.Chat.exists({ _id: chatId, participants: userId });
                if (!allowed) {
                    socket.emit('ACK_ERROR', {
                        message: 'You are not a participant of this chat',
                        chatId: String(chatId),
                    });
                    handleEventProcessed('LEAVE_CHAT_DENIED', `for chat_id: ${chatId}`);
                    return;
                }
                socket.leave(CHAT_ROOM(chatId));
                yield (0, presenceHelper_1.removeUserRoom)(userId, chatId);
                handleEventProcessed('LEAVE_CHAT', `for chat_id: ${chatId}`);
                // Notify others that user went offline in this chat
                const lastActive = yield (0, presenceHelper_1.getLastActive)(userId);
                io.to(CHAT_ROOM(chatId)).emit('USER_OFFLINE', {
                    userId,
                    chatId,
                    lastActive,
                });
                logger_1.logger.info(colors_1.default.yellow(`User ${userId} left chat room ${CHAT_ROOM(chatId)}`));
            }));
            // ---------------------------------------------
            // 🔹 Typing Indicators
            // ---------------------------------------------
            socket.on('TYPING_START', (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId }) {
                if (!chatId)
                    return;
                // Guard: Only participants can emit typing events for a chat
                const allowed = yield chat_model_1.Chat.exists({ _id: chatId, participants: userId });
                if (!allowed) {
                    handleEventProcessed('TYPING_START_DENIED', `for chat_id: ${chatId}`);
                    return;
                }
                // Throttle typing events per user per chat using Redis TTL key
                try {
                    const redis = (0, redis_1.getRedisClient)();
                    if (redis) {
                        const key = TYPING_KEY(chatId, userId);
                        // Emit only when key is absent; set key with short TTL to throttle
                        const setRes = yield redis.set(key, '1', 'EX', TYPING_TTL_SECONDS, 'NX');
                        if (!setRes) {
                            // Key exists → skip emission to reduce noise
                            handleEventProcessed('TYPING_START_THROTTLED_SKIP', `for chat_id: ${chatId}`);
                            return;
                        }
                    }
                }
                catch (_b) { }
                io.to(CHAT_ROOM(chatId)).emit('TYPING_START', { userId, chatId });
                handleEventProcessed('TYPING_START', `for chat_id: ${chatId}`);
            }));
            socket.on('TYPING_STOP', (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId }) {
                if (!chatId)
                    return;
                // Guard: Only participants can emit typing stop events
                const allowed = yield chat_model_1.Chat.exists({ _id: chatId, participants: userId });
                if (!allowed) {
                    handleEventProcessed('TYPING_STOP_DENIED', `for chat_id: ${chatId}`);
                    return;
                }
                // Clear throttle key so next start can emit immediately
                try {
                    const redis = (0, redis_1.getRedisClient)();
                    if (redis) {
                        yield redis.del(TYPING_KEY(chatId, userId));
                    }
                }
                catch (_b) { }
                io.to(CHAT_ROOM(chatId)).emit('TYPING_STOP', { userId, chatId });
                handleEventProcessed('TYPING_STOP', `for chat_id: ${chatId}`);
            }));
            // ---------------------------------------------
            // 🔹 Message Delivery & Read Acknowledgements
            // ---------------------------------------------
            socket.on('DELIVERED_ACK', (_a) => __awaiter(void 0, [_a], void 0, function* ({ messageId }) {
                try {
                    const found = yield message_model_1.Message.findById(messageId).select('_id chatId');
                    if (!found) {
                        socket.emit('ACK_ERROR', {
                            message: 'Message not found',
                            messageId,
                        });
                        return;
                    }
                    const allowed = yield chat_model_1.Chat.exists({ _id: found.chatId, participants: userId });
                    if (!allowed) {
                        socket.emit('ACK_ERROR', {
                            message: 'You are not a participant of this chat',
                            chatId: String(found.chatId),
                            messageId: String(found._id),
                        });
                        handleEventProcessed('DELIVERED_ACK_DENIED', `chat_id: ${String(found.chatId)}`);
                        return;
                    }
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
                    const found = yield message_model_1.Message.findById(messageId).select('_id chatId');
                    if (!found) {
                        socket.emit('ACK_ERROR', {
                            message: 'Message not found',
                            messageId,
                        });
                        return;
                    }
                    const allowed = yield chat_model_1.Chat.exists({ _id: found.chatId, participants: userId });
                    if (!allowed) {
                        socket.emit('ACK_ERROR', {
                            message: 'You are not a participant of this chat',
                            chatId: String(found.chatId),
                            messageId: String(found._id),
                        });
                        handleEventProcessed('READ_ACK_DENIED', `chat_id: ${String(found.chatId)}`);
                        return;
                    }
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
                    yield (0, presenceHelper_1.updateLastActive)(userId);
                    const remaining = yield (0, presenceHelper_1.decrConnCount)(userId);
                    const lastActive = yield (0, presenceHelper_1.getLastActive)(userId);
                    // Only mark offline and broadcast if no other sessions remain
                    if (!remaining || remaining <= 0) {
                        yield (0, presenceHelper_1.setOffline)(userId);
                        // Notify all chat rooms this user participated in
                        try {
                            const rooms = yield (0, presenceHelper_1.getUserRooms)(userId);
                            for (const chatId of rooms || []) {
                                io.to(CHAT_ROOM(String(chatId))).emit('USER_OFFLINE', {
                                    userId,
                                    chatId: String(chatId),
                                    lastActive,
                                });
                            }
                            yield (0, presenceHelper_1.clearUserRooms)(userId);
                        }
                        catch (_a) { }
                    }
                    else {
                        logger_1.logger.info(colors_1.default.yellow(`User ${userId} disconnected one session; ${remaining} session(s) remain.`));
                    }
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
