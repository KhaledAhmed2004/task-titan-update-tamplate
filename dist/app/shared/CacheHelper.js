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
class CacheHelper {
    constructor(options = {}) {
        this.cache = new node_cache_1.default({
            stdTTL: options.ttl || 600, // Default 10 minutes
            checkperiod: options.checkperiod || 120, // Check every 2 minutes
            useClones: false
        });
    }
    static getInstance(options) {
        if (!CacheHelper.instance) {
            CacheHelper.instance = new CacheHelper(options);
        }
        return CacheHelper.instance;
    }
    // Basic cache operations
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl || 0);
    }
    get(key) {
        return this.cache.get(key);
    }
    del(key) {
        return this.cache.del(key);
    }
    has(key) {
        return this.cache.has(key);
    }
    flush() {
        this.cache.flushAll();
    }
    // Advanced operations
    getOrSet(key, fetchFunction, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = this.get(key);
            if (cached !== undefined) {
                return cached;
            }
            const fresh = yield fetchFunction();
            this.set(key, fresh, ttl);
            return fresh;
        });
    }
    // Cache with tags for group invalidation
    setWithTags(key, value, tags, ttl) {
        const success = this.set(key, value, ttl);
        if (success) {
            // Store tag associations
            tags.forEach(tag => {
                const tagKey = `tag:${tag}`;
                const taggedKeys = this.get(tagKey) || [];
                if (!taggedKeys.includes(key)) {
                    taggedKeys.push(key);
                    this.set(tagKey, taggedKeys);
                }
            });
        }
        return success;
    }
    invalidateByTag(tag) {
        const tagKey = `tag:${tag}`;
        const taggedKeys = this.get(tagKey) || [];
        const deletedCount = this.del(taggedKeys);
        this.del(tagKey);
        return deletedCount;
    }
    // Common cache patterns
    cacheUserData(userId, data, ttl = 1800) {
        return this.setWithTags(`user:${userId}`, data, ['users'], ttl);
    }
    cacheTaskData(taskId, data, ttl = 900) {
        return this.setWithTags(`task:${taskId}`, data, ['tasks'], ttl);
    }
    cacheCategoryData(categoryId, data, ttl = 3600) {
        return this.setWithTags(`category:${categoryId}`, data, ['categories'], ttl);
    }
    cacheSearchResults(searchKey, results, ttl = 300) {
        return this.setWithTags(`search:${searchKey}`, results, ['search'], ttl);
    }
    // Invalidation helpers
    invalidateUser(userId) {
        return this.del(`user:${userId}`);
    }
    invalidateTask(taskId) {
        return this.del(`task:${taskId}`);
    }
    invalidateAllUsers() {
        return this.invalidateByTag('users');
    }
    invalidateAllTasks() {
        return this.invalidateByTag('tasks');
    }
    invalidateAllCategories() {
        return this.invalidateByTag('categories');
    }
    invalidateAllSearches() {
        return this.invalidateByTag('search');
    }
    // Statistics
    getStats() {
        return this.cache.getStats();
    }
    getKeys() {
        return this.cache.keys();
    }
    // Utility methods
    generateCacheKey(...parts) {
        return parts.join(':');
    }
    // Middleware for Express
    cacheMiddleware(ttl = 300) {
        return (req, res, next) => {
            const key = this.generateCacheKey('route', req.originalUrl);
            const cached = this.get(key);
            if (cached) {
                return res.json(cached);
            }
            const originalSend = res.json;
            res.json = (data) => {
                this.set(key, data, ttl);
                return originalSend.call(res, data);
            };
            next();
        };
    }
}
exports.CacheHelper = CacheHelper;
