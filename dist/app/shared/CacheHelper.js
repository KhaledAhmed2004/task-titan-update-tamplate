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
exports.CacheHelper = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const redis_1 = require("../../config/redis");
class CacheHelper {
    constructor(options = {}) {
        this.cache = new node_cache_1.default({
            stdTTL: options.ttl || 600, // Default 10 minutes
            checkperiod: options.checkperiod || 120, // Check every 2 minutes
            useClones: false,
        });
        this.redis = (0, redis_1.getRedisClient)();
    }
    static getInstance(options) {
        if (!CacheHelper.instance) {
            CacheHelper.instance = new CacheHelper(options);
        }
        return CacheHelper.instance;
    }
    // Basic cache operations
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redis) {
                const payload = JSON.stringify(value);
                try {
                    if (ttl && ttl > 0) {
                        yield this.redis.set(key, payload, 'EX', ttl);
                    }
                    else {
                        yield this.redis.set(key, payload);
                    }
                    return true;
                }
                catch (_a) {
                    // Fallback to memory on error
                    return this.cache.set(key, value, ttl || 0);
                }
            }
            return this.cache.set(key, value, ttl || 0);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redis) {
                try {
                    const val = yield this.redis.get(key);
                    return val ? JSON.parse(val) : undefined;
                }
                catch (_a) {
                    return this.cache.get(key);
                }
            }
            return this.cache.get(key);
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redis) {
                try {
                    const keys = Array.isArray(key) ? key : [key];
                    const res = yield this.redis.del(...keys);
                    return res;
                }
                catch (_a) {
                    return this.cache.del(key);
                }
            }
            return this.cache.del(key);
        });
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redis) {
                try {
                    const exists = yield this.redis.exists(key);
                    return exists === 1;
                }
                catch (_a) {
                    return this.cache.has(key);
                }
            }
            return this.cache.has(key);
        });
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redis) {
                try {
                    yield this.redis.flushdb();
                    return;
                }
                catch (_a) {
                    // fall through
                }
            }
            this.cache.flushAll();
        });
    }
    // Advanced operations
    getOrSet(key, fetchFunction, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = yield this.get(key);
            if (cached !== undefined) {
                return cached;
            }
            const fresh = yield fetchFunction();
            yield this.set(key, fresh, ttl);
            return fresh;
        });
    }
    // Cache with tags for group invalidation
    setWithTags(key, value, tags, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield this.set(key, value, ttl);
            if (success) {
                for (const tag of tags) {
                    const tagKey = `tag:${tag}`;
                    const existing = (yield this.get(tagKey)) || [];
                    if (!existing.includes(key)) {
                        existing.push(key);
                        yield this.set(tagKey, existing);
                    }
                }
            }
            return success;
        });
    }
    invalidateByTag(tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const tagKey = `tag:${tag}`;
            const taggedKeys = (yield this.get(tagKey)) || [];
            const deletedCount = yield this.del(taggedKeys);
            yield this.del(tagKey);
            return deletedCount;
        });
    }
    // Common cache patterns
    cacheUserData(userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data, ttl = 1800) {
            return this.setWithTags(`user:${userId}`, data, ['users'], ttl);
        });
    }
    cacheTaskData(taskId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (taskId, data, ttl = 900) {
            return this.setWithTags(`task:${taskId}`, data, ['tasks'], ttl);
        });
    }
    cacheCategoryData(categoryId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (categoryId, data, ttl = 3600) {
            return this.setWithTags(`category:${categoryId}`, data, ['categories'], ttl);
        });
    }
    cacheSearchResults(searchKey_1, results_1) {
        return __awaiter(this, arguments, void 0, function* (searchKey, results, ttl = 300) {
            return this.setWithTags(`search:${searchKey}`, results, ['search'], ttl);
        });
    }
    // Invalidation helpers
    invalidateUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.del(`user:${userId}`);
        });
    }
    invalidateTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.del(`task:${taskId}`);
        });
    }
    invalidateAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invalidateByTag('users');
        });
    }
    invalidateAllTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invalidateByTag('tasks');
        });
    }
    invalidateAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invalidateByTag('categories');
        });
    }
    invalidateAllSearches() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invalidateByTag('search');
        });
    }
    // Statistics
    getStats() {
        // Redis stats not implemented; return NodeCache stats for fallback
        return this.cache.getStats();
    }
    getKeys() {
        // Redis keys listing is not exposed to avoid performance issues
        return this.cache.keys();
    }
    // Utility methods
    generateCacheKey(...parts) {
        return parts.join(':');
    }
    // Middleware for Express
    cacheMiddleware(ttl = 300) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const key = this.generateCacheKey('route', req.originalUrl);
            const cached = yield this.get(key);
            if (cached !== undefined) {
                return res.json(cached);
            }
            const originalSend = res.json;
            res.json = (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.set(key, data, ttl);
                return originalSend.call(res, data);
            });
            next();
        });
    }
}
exports.CacheHelper = CacheHelper;
