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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const message_model_1 = require("../message/message.model");
const chat_model_1 = require("./chat.model");
const createChatToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistChat = yield chat_model_1.Chat.findOne({
        participants: { $all: payload },
    });
    if (isExistChat) {
        return isExistChat;
    }
    const chat = yield chat_model_1.Chat.create({ participants: payload });
    return chat;
});
const getChatFromDB = (user, search) => __awaiter(void 0, void 0, void 0, function* () {
    const chats = yield chat_model_1.Chat.find({ participants: { $in: [user.id] } })
        .populate({
        path: 'participants',
        select: '_id name image',
        match: Object.assign({ _id: { $ne: user.id } }, (search && { name: { $regex: search, $options: 'i' } })),
    })
        .select('participants status');
    // Filter out chats where no participants match the search (empty participants)
    const filteredChats = chats === null || chats === void 0 ? void 0 : chats.filter((chat) => { var _a; return ((_a = chat === null || chat === void 0 ? void 0 : chat.participants) === null || _a === void 0 ? void 0 : _a.length) > 0; });
    //Use Promise.all to handle the asynchronous operations inside the map
    const chatList = yield Promise.all(filteredChats === null || filteredChats === void 0 ? void 0 : filteredChats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
        const data = chat === null || chat === void 0 ? void 0 : chat.toObject();
        const lastMessage = yield message_model_1.Message.findOne({
            chatId: chat === null || chat === void 0 ? void 0 : chat._id,
        })
            .sort({ createdAt: -1 })
            .select('text offer createdAt sender');
        return Object.assign(Object.assign({}, data), { lastMessage: lastMessage || null });
    })));
    return chatList;
});
exports.ChatService = { createChatToDB, getChatFromDB };
