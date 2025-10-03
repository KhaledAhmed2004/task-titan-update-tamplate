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
exports.redisPing = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
let redis = null;
const getRedisClient = () => {
    if (redis)
        return redis;
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
        redis = new ioredis_1.default(url, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
        });
        // Basic event logging
        redis.on('connect', () => {
            console.log('[Redis] Connected');
        });
        redis.on('error', (err) => {
            console.error('[Redis] Error:', err.message);
        });
        redis.on('end', () => {
            console.warn('[Redis] Connection closed');
        });
        return redis;
    }
    catch (e) {
        console.error('[Redis] Failed to initialize:', e.message);
        return null;
    }
};
exports.getRedisClient = getRedisClient;
const redisPing = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.getRedisClient)();
    if (!client)
        return false;
    try {
        const res = yield client.ping();
        return res === 'PONG';
    }
    catch (_a) {
        return false;
    }
});
exports.redisPing = redisPing;
