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
const logger_1 = require("../shared/logger");
const _1 = __importDefault(require("."));
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
            logger_1.logger.info('✅ Redis connected');
        });
        redis.on('ready', () => {
            logger_1.logger.info('✅ Redis ready');
        });
        redis.on('error', (err) => {
            logger_1.errorLogger.error(`❌ Redis connection failed: ${err.message}`);
            (0, logger_1.notifyCritical)('Redis Connection Failed', err.message);
        });
        redis.on('end', () => {
            logger_1.logger.warn('⚠️ Redis connection closed');
        });
        // Instrument common commands for debugging and timing in development
        const instrument = (method) => {
            const original = redis[method].bind(redis);
            redis[method] = (...args) => __awaiter(void 0, void 0, void 0, function* () {
                const key = args[0];
                if (_1.default.node_env === 'development') {
                    logger_1.logger.debug(`🔹 Redis ${method.toUpperCase()} key: ${key}`);
                }
                const start = Date.now();
                try {
                    const result = yield original(...args);
                    const ms = Date.now() - start;
                    logger_1.logger.info(`⏱️ Redis command executed in ${ms}ms`);
                    return result;
                }
                catch (err) {
                    logger_1.errorLogger.error(`❌ Redis ${method.toUpperCase()} failed: ${err.message}`);
                    throw err;
                }
            });
        };
        instrument('get');
        instrument('set');
        instrument('del');
        instrument('incr');
        return redis;
    }
    catch (e) {
        logger_1.errorLogger.error(`❌ Redis connection failed: ${e.message}`);
        (0, logger_1.notifyCritical)('Redis Initialization Failed', e.message);
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
