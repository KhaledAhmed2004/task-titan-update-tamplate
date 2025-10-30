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
exports.UnreadHelper = exports.clearUnreadCount = exports.incrementUnreadCount = exports.setUnreadCount = exports.getUnreadCountCached = void 0;
const redis_1 = require("../../config/redis");
const CHAT_UNREAD_PREFIX = 'chat:unread_count:'; // chat:unread_count:<chatId>
const chatKey = (chatId) => `${CHAT_UNREAD_PREFIX}${String(chatId)}`;
const getUnreadCountCached = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    const v = yield redis.hget(chatKey(chatId), String(userId));
    if (v === null || v === undefined)
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
});
exports.getUnreadCountCached = getUnreadCountCached;
const setUnreadCount = (chatId, userId, count) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.hset(chatKey(chatId), String(userId), String(count));
});
exports.setUnreadCount = setUnreadCount;
const incrementUnreadCount = (chatId, userId, delta) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    const res = yield redis.hincrby(chatKey(chatId), String(userId), delta);
    return typeof res === 'number' ? res : Number(res !== null && res !== void 0 ? res : 0);
});
exports.incrementUnreadCount = incrementUnreadCount;
const clearUnreadCount = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.hdel(chatKey(chatId), String(userId));
});
exports.clearUnreadCount = clearUnreadCount;
exports.UnreadHelper = {
    getUnreadCountCached: exports.getUnreadCountCached,
    setUnreadCount: exports.setUnreadCount,
    incrementUnreadCount: exports.incrementUnreadCount,
    clearUnreadCount: exports.clearUnreadCount,
};
