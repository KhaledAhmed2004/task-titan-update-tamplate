import NodeCache from 'node-cache';
import type Redis from 'ioredis';
import { getRedisClient } from '../../config/redis';
import { logger, errorLogger } from '../../shared/logger';

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
    // Initialization log
    logger.info('🔹 CacheHelper initialized');
  }

  public static getInstance(options?: ICacheOptions): CacheHelper {
    if (!CacheHelper.instance) {
      CacheHelper.instance = new CacheHelper(options);
    }
    return CacheHelper.instance;
  }

  // Basic cache operations
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const start = Date.now();
    if (this.redis) {
      const payload = JSON.stringify(value);
      try {
        logger.debug(`🔹 Cache SET key: ${key}`);
        if (ttl && ttl > 0) {
          await this.redis.set(key, payload, 'EX', ttl);
        } else {
          await this.redis.set(key, payload);
        }
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return true;
      } catch (e) {
        errorLogger.error(`❌ Cache operation failed: ${(e as Error).message}`);
        // Fallback to memory on error
        const ok = this.cache.set(key, value, ttl || 0);
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return ok;
      }
    }
    logger.debug(`🔹 Cache SET key: ${key}`);
    const ok = this.cache.set(key, value, ttl || 0);
    logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
    return ok;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const start = Date.now();
    if (this.redis) {
      try {
        logger.debug(`🔹 Cache GET key: ${key}`);
        const val = await this.redis.get(key);
        const parsed = val ? (JSON.parse(val) as T) : undefined;
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return parsed;
      } catch (e) {
        errorLogger.error(`❌ Cache operation failed: ${(e as Error).message}`);
        const res = this.cache.get<T>(key);
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return res;
      }
    }
    logger.debug(`🔹 Cache GET key: ${key}`);
    const res = this.cache.get<T>(key);
    logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
    return res;
  }

  async del(key: string | string[]): Promise<number> {
    const start = Date.now();
    const keys = Array.isArray(key) ? key : [key];
    if (this.redis) {
      try {
        logger.debug(`🔹 Cache DEL key: ${keys.join(',')}`);
        const res = await this.redis.del(...keys);
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return res;
      } catch (e) {
        errorLogger.error(`❌ Cache operation failed: ${(e as Error).message}`);
        const res = this.cache.del(key);
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return res;
      }
    }
    logger.debug(`🔹 Cache DEL key: ${keys.join(',')}`);
    const res = this.cache.del(key);
    logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
    return res;
  }

  async has(key: string): Promise<boolean> {
    const start = Date.now();
    if (this.redis) {
      try {
        logger.debug(`🔹 Cache HAS key: ${key}`);
        const exists = await this.redis.exists(key);
        const res = exists === 1;
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return res;
      } catch (e) {
        errorLogger.error(`❌ Cache operation failed: ${(e as Error).message}`);
        const res = this.cache.has(key);
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return res;
      }
    }
    logger.debug(`🔹 Cache HAS key: ${key}`);
    const res = this.cache.has(key);
    logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
    return res;
  }

  async flush(): Promise<void> {
    const start = Date.now();
    try {
      if (this.redis) {
        logger.debug('🔹 Cache FLUSH');
        await this.redis.flushdb();
        logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
        return;
      }
    } catch (e) {
      errorLogger.error(`❌ Cache operation failed: ${(e as Error).message}`);
    }
    logger.debug('🔹 Cache FLUSH (memory)');
    this.cache.flushAll();
    logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
  }

  // Advanced operations
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const start = Date.now();
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      logger.debug(`🔹 Cache HIT key: ${key}`);
      logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
      return cached;
    }

    logger.debug(`🔹 Cache MISS key: ${key}`);
    const fresh = await fetchFunction();
    await this.set(key, fresh, ttl);
    logger.info(`⏱️ Cache operation took: ${Date.now() - start}ms`);
    return fresh;
  }

  // Cache with tags for group invalidation
  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number
  ): Promise<boolean> {
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
  async cacheUserData<T>(
    userId: string,
    data: T,
    ttl: number = 1800
  ): Promise<boolean> {
    return this.setWithTags(`user:${userId}`, data, ['users'], ttl);
  }

  async cacheTaskData<T>(
    taskId: string,
    data: T,
    ttl: number = 900
  ): Promise<boolean> {
    return this.setWithTags(`task:${taskId}`, data, ['tasks'], ttl);
  }

  async cacheCategoryData<T>(
    categoryId: string,
    data: T,
    ttl: number = 3600
  ): Promise<boolean> {
    return this.setWithTags(
      `category:${categoryId}`,
      data,
      ['categories'],
      ttl
    );
  }

  async cacheSearchResults<T>(
    searchKey: string,
    results: T,
    ttl: number = 300
  ): Promise<boolean> {
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
