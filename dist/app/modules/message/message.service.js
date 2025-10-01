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
const sendMessageToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // save to DB
    const response = yield message_model_1.Message.create(payload);
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`getMessage::${payload === null || payload === void 0 ? void 0 : payload.chatId}`, response);
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
    // Reverse messages so that oldest is first if your UI appends messages top -> bottom
    messages = messages.reverse();
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
exports.MessageService = { sendMessageToDB, getMessageFromDB };
