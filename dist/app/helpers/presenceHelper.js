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
exports.getConnCount = exports.decrConnCount = exports.incrConnCount = exports.clearUserRooms = exports.getUserRooms = exports.removeUserRoom = exports.addUserRoom = exports.getLastActive = exports.isOnline = exports.updateLastActive = exports.setOffline = exports.setOnline = void 0;
const redis_1 = require("../../config/redis");
const ONLINE_SET = 'presence:online';
const LAST_ACTIVE_PREFIX = 'presence:lastActive:'; // presence:lastActive:<userId>
const USER_ROOMS_PREFIX = 'presence:userRooms:'; // presence:userRooms:<userId>
const CONN_COUNT_PREFIX = 'presence:connCount:'; // presence:connCount:<userId>
const setOnline = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.sadd(ONLINE_SET, userId);
    yield redis.set(LAST_ACTIVE_PREFIX + userId, Date.now().toString());
});
exports.setOnline = setOnline;
const setOffline = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.srem(ONLINE_SET, userId);
    yield redis.set(LAST_ACTIVE_PREFIX + userId, Date.now().toString());
});
exports.setOffline = setOffline;
const updateLastActive = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.set(LAST_ACTIVE_PREFIX + userId, Date.now().toString());
});
exports.updateLastActive = updateLastActive;
const isOnline = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    const res = yield redis.sismember(ONLINE_SET, userId);
    return res === 1;
});
exports.isOnline = isOnline;
const getLastActive = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    const ts = yield redis.get(LAST_ACTIVE_PREFIX + userId);
    return ts ? Number(ts) : undefined;
});
exports.getLastActive = getLastActive;
const addUserRoom = (userId, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.sadd(USER_ROOMS_PREFIX + userId, chatId);
});
exports.addUserRoom = addUserRoom;
const removeUserRoom = (userId, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.srem(USER_ROOMS_PREFIX + userId, chatId);
});
exports.removeUserRoom = removeUserRoom;
const getUserRooms = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    return yield redis.smembers(USER_ROOMS_PREFIX + userId);
});
exports.getUserRooms = getUserRooms;
const clearUserRooms = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    yield redis.del(USER_ROOMS_PREFIX + userId);
});
exports.clearUserRooms = clearUserRooms;
const incrConnCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    return yield redis.incr(CONN_COUNT_PREFIX + userId);
});
exports.incrConnCount = incrConnCount;
const decrConnCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    const key = CONN_COUNT_PREFIX + userId;
    const res = yield redis.decr(key);
    if (typeof res === 'number' && res < 0) {
        yield redis.set(key, '0');
        return 0;
    }
    return typeof res === 'number' ? res : 0;
});
exports.decrConnCount = decrConnCount;
const getConnCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const redis = (0, redis_1.getRedisClient)();
    const v = yield redis.get(CONN_COUNT_PREFIX + userId);
    return v ? Number(v) : 0;
});
exports.getConnCount = getConnCount;
