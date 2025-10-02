import NodeCache from 'node-cache';
import type Redis from 'ioredis';
import { getRedisClient } from '../../config/redis';

export interface ICacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // Check period for expired keys
}

export class CacheHelper {
  private static instance: CacheHelper;
  private cache: NodeCache;
  private redis: Redis | null;

  private constructor(options: ICacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 600, // Default 10 minutes
      checkperiod: options.checkperiod || 120, // Check every 2 minutes
      useClones: false,
    });
    this.redis = getRedisClient();
  }

  public static getInstance(options?: ICacheOptions): CacheHelper {
    if (!CacheHelper.instance) {
      CacheHelper.instance = new CacheHelper(options);
    }
    return CacheHelper.instance;
  }

  // Basic cache operations
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (this.redis) {
      const payload = JSON.stringify(value);
      try {
        if (ttl && ttl > 0) {
          await this.redis.set(key, payload, 'EX', ttl);
        } else {
          await this.redis.set(key, payload);
        }
        return true;
      } catch {
        // Fallback to memory on error
        return this.cache.set(key, value, ttl || 0);
      }
    }
    return this.cache.set(key, value, ttl || 0);
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.redis) {
      try {
        const val = await this.redis.get(key);
        return val ? (JSON.parse(val) as T) : undefined;
      } catch {
        return this.cache.get<T>(key);
      }
    }
    return this.cache.get<T>(key);
  }

  async del(key: string | string[]): Promise<number> {
    if (this.redis) {
      try {
        const keys = Array.isArray(key) ? key : [key];
        const res = await this.redis.del(...keys);
        return res;
      } catch {
        return this.cache.del(key);
      }
    }
    return this.cache.del(key);
  }

  async has(key: string): Promise<boolean> {
    if (this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch {
        return this.cache.has(key);
      }
    }
    return this.cache.has(key);
  }

  async flush(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.flushdb();
        return;
      } catch {
        // fall through
      }
    }
    this.cache.flushAll();
  }

  // Advanced operations
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFunction();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  // Cache with tags for group invalidation
  async setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): Promise<boolean> {
    const success = await this.set(key, value, ttl);
    if (success) {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const existing = (await this.get<string[]>(tagKey)) || [];
        if (!existing.includes(key)) {
          existing.push(key);
          await this.set(tagKey, existing);
        }
      }
    }
    return success;
  }

  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = `tag:${tag}`;
    const taggedKeys = (await this.get<string[]>(tagKey)) || [];
    const deletedCount = await this.del(taggedKeys);
    await this.del(tagKey);
    return deletedCount;
  }

  // Common cache patterns
  async cacheUserData<T>(userId: string, data: T, ttl: number = 1800): Promise<boolean> {
    return this.setWithTags(`user:${userId}`, data, ['users'], ttl);
  }

  async cacheTaskData<T>(taskId: string, data: T, ttl: number = 900): Promise<boolean> {
    return this.setWithTags(`task:${taskId}`, data, ['tasks'], ttl);
  }

  async cacheCategoryData<T>(categoryId: string, data: T, ttl: number = 3600): Promise<boolean> {
    return this.setWithTags(`category:${categoryId}`, data, ['categories'], ttl);
  }

  async cacheSearchResults<T>(searchKey: string, results: T, ttl: number = 300): Promise<boolean> {
    return this.setWithTags(`search:${searchKey}`, results, ['search'], ttl);
  }

  // Invalidation helpers
  async invalidateUser(userId: string): Promise<number> {
    return this.del(`user:${userId}`);
  }

  async invalidateTask(taskId: string): Promise<number> {
    return this.del(`task:${taskId}`);
  }

  async invalidateAllUsers(): Promise<number> {
    return this.invalidateByTag('users');
  }

  async invalidateAllTasks(): Promise<number> {
    return this.invalidateByTag('tasks');
  }

  async invalidateAllCategories(): Promise<number> {
    return this.invalidateByTag('categories');
  }

  async invalidateAllSearches(): Promise<number> {
    return this.invalidateByTag('search');
  }

  // Statistics
  getStats() {
    // Redis stats not implemented; return NodeCache stats for fallback
    return this.cache.getStats();
  }

  getKeys(): string[] {
    // Redis keys listing is not exposed to avoid performance issues
    return this.cache.keys();
  }

  // Utility methods
  generateCacheKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  // Middleware for Express
  cacheMiddleware(ttl: number = 300) {
    return async (req: any, res: any, next: any) => {
      const key = this.generateCacheKey('route', req.originalUrl);
      const cached = await this.get(key);

      if (cached !== undefined) {
        return res.json(cached);
      }

      const originalSend = res.json;
      res.json = async (data: any) => {
        await this.set(key, data, ttl);
        return originalSend.call(res, data);
      };

      next();
    };
  }
}