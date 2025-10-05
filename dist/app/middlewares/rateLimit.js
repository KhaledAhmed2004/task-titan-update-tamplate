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
exports.rateLimitMiddleware = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const redis_1 = require("../../config/redis");
const memory = new node_cache_1.default({ stdTTL: 60, checkperiod: 30 });
const rateLimitMiddleware = (options) => {
    const { windowMs, max, keyResolver, routeName } = options;
    const redis = (0, redis_1.getRedisClient)();
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const identifier = keyResolver ? keyResolver(req) : req.ip;
        const key = `ratelimit:${routeName || req.path}:${identifier}`;
        try {
            if (redis) {
                const count = yield redis.incr(key);
                if (count === 1) {
                    yield redis.expire(key, Math.ceil(windowMs / 1000));
                }
                if (count > max) {
                    return res.status(429).json({
                        success: false,
                        message: 'Too many requests, please try again later',
                    });
                }
                return next();
            }
            // Fallback: in-memory counter
            const current = (memory.get(key) || 0) + 1;
            memory.set(key, current, Math.ceil(windowMs / 1000));
            if (current > max) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later',
                });
            }
            return next();
        }
        catch (e) {
            // On any error, allow request but log
            console.error('[RateLimit] error:', e.message);
            return next();
        }
    });
};
exports.rateLimitMiddleware = rateLimitMiddleware;
