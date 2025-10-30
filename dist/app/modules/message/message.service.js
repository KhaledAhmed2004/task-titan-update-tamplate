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
exports.MessageService = void 0;
const message_model_1 = require("./message.model");
const chat_model_1 = require("../chat/chat.model");
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const presenceHelper_1 = require("../../helpers/presenceHelper");
const unreadHelper_1 = require("../../helpers/unreadHelper");
const notificationsHelper_1 = require("../notification/notificationsHelper");
const sendMessageToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure attachments is always an array
    if (!Array.isArray(payload.attachments)) {
        payload.attachments = [];
    }
    // Authorization: sender must be a participant of the chat
    const isParticipant = yield chat_model_1.Chat.exists({
        _id: payload === null || payload === void 0 ? void 0 : payload.chatId,
        participants: payload === null || payload === void 0 ? void 0 : payload.sender,
    });
    if (!isParticipant) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not a participant of this chat');
    }
    // save to DB
    const response = yield message_model_1.Message.create(payload);
    //@ts-ignore
    const io = global.io;
    if (io) {
        // Room-based event for chat participants
        io.to(`chat::${String(payload === null || payload === void 0 ? void 0 : payload.chatId)}`).emit('MESSAGE_SENT', {
            message: response,
        });
    }
    // Offline notification triggers
    try {
        const chat = yield chat_model_1.Chat.findById(response.chatId).select('participants');
        const participants = ((chat === null || chat === void 0 ? void 0 : chat.participants) || [])
            .map(p => String(p))
            .filter(Boolean);
        const receivers = participants.filter(p => String(p) !== String(response.sender));
        // Increment unread count for receivers
        for (const receiverId of receivers) {
            try {
                yield (0, unreadHelper_1.incrementUnreadCount)(String(response.chatId), String(receiverId), 1);
            }
            catch (_a) { }
        }
        for (const receiverId of receivers) {
            const online = yield (0, presenceHelper_1.isOnline)(receiverId);
            if (!online) {
                const preview = response.text || 'New message';
                yield (0, notificationsHelper_1.sendNotifications)({
                    title: 'New Message',
                    text: preview,
                    receiver: receiverId,
                    isRead: false,
                    type: 'SYSTEM',
                    referenceId: response._id,
                });
            }
        }
    }
    catch (err) {
        // Swallow notification errors to not block messaging
    }
    return response;
});
const getMessageFromDB = (user, id, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
    }
    const queryBuilder = new QueryBuilder_1.default(message_model_1.Message.find({ chatId: id }), query)
        .search(['text'])
        .filter()
        .sort()
        .paginate()
        .fields();
    // Fetch messages
    let messages = yield queryBuilder.modelQuery;
    // Explicitly sort by createdAt ASC for predictable ordering
    messages = messages.sort((a, b) => new Date(a === null || a === void 0 ? void 0 : a.createdAt).getTime() -
        new Date(b === null || b === void 0 ? void 0 : b.createdAt).getTime());
    // Get pagination info
    const pagination = yield queryBuilder.getPaginationInfo();
    // Fetch the chat participant (exclude the logged-in user)
    const chat = yield chat_model_1.Chat.findById(id).populate({
        path: 'participants',
        select: 'name profile location',
        match: { _id: { $ne: user.id } },
    });
    const participant = (chat === null || chat === void 0 ? void 0 : chat.participants[0]) || null;
    return {
        messages,
        pagination,
        participant,
    };
});
const markAsDelivered = (messageId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(messageId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Message ID');
    }
    const updated = yield message_model_1.Message.findByIdAndUpdate(messageId, { $addToSet: { deliveredTo: userId } }, { new: true });
    return updated;
});
const markChatAsRead = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(chatId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
    }
    // Find messages that will be marked as read
    const toUpdate = yield message_model_1.Message.find({
        chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
    }).select('_id chatId');
    if (!toUpdate.length) {
        return { modifiedCount: 0, updatedIds: [] };
    }
    // Mark them as read for this user
    yield message_model_1.Message.updateMany({ _id: { $in: toUpdate.map(m => m._id) } }, { $addToSet: { readBy: userId } });
    // Emit real-time MESSAGE_READ for each updated message to the chat room
    // @ts-ignore
    const io = global.io;
    if (io) {
        for (const msg of toUpdate) {
            io.to(`chat::${String(chatId)}`).emit('MESSAGE_READ', {
                messageId: String(msg._id),
                chatId: String(chatId),
                userId,
            });
        }
    }
    // Reset unread count cache for this user on this chat
    try {
        yield (0, unreadHelper_1.setUnreadCount)(String(chatId), String(userId), 0);
    }
    catch (_a) { }
    return { modifiedCount: toUpdate.length, updatedIds: toUpdate.map(m => String(m._id)) };
});
const getUnreadCount = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield message_model_1.Message.countDocuments({
        chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
    });
    return count;
});
exports.MessageService = {
    sendMessageToDB,
    getMessageFromDB,
    markAsDelivered,
    markChatAsRead,
    getUnreadCount,
};
