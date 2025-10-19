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
      stdTTL: options.ttl || 600,
      checkperiod: options.checkperiod || 120,
      useClones: false,
    });
    this.redis = getRedisClient();
    logger.info('🔹 CacheHelper initialized');
  }

  public static getInstance(options?: ICacheOptions): CacheHelper {
    if (!CacheHelper.instance) {
      CacheHelper.instance = new CacheHelper(options);
    }
    return CacheHelper.instance;
  }

  // ------------------- Basic Cache Operations -------------------

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const start = Date.now();
    const logPrefix = `[CACHE][SET] key:${key}`;
    try {
      if (this.redis) {
        const payload = JSON.stringify(value);
        if (ttl && ttl > 0) await this.redis.set(key, payload, 'EX', ttl);
        else await this.redis.set(key, payload);

        logger.info(
          `${logPrefix} ✅ | TTL: ${ttl || 'default'} | ⏱ ${
            Date.now() - start
          }ms`
        );
        return true;
      }

      const ok = this.cache.set(key, value, ttl || 0);
      logger.info(
        `${logPrefix} ✅ (memory) | TTL: ${ttl || 'default'} | ⏱ ${
          Date.now() - start
        }ms`
      );
      return ok;
    } catch (err) {
      errorLogger.error(
        `${logPrefix} ❌ | ${(err as Error).message} | ⏱ ${
          Date.now() - start
        }ms`
      );
      // Fallback to memory
      const ok = this.cache.set(key, value, ttl || 0);
      return ok;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const start = Date.now();
    const logPrefix = `[CACHE][GET] key:${key}`;
    try {
      if (this.redis) {
        const val = await this.redis.get(key);
        const parsed = val ? (JSON.parse(val) as T) : undefined;
        logger.info(
          `${logPrefix} ${parsed ? 'HIT ✅' : 'MISS ⚠️'} | ⏱ ${
            Date.now() - start
          }ms`
        );
        return parsed;
      }

      const res = this.cache.get<T>(key);
      logger.info(
        `${logPrefix} ${res ? 'HIT ✅ (memory)' : 'MISS ⚠️ (memory)'} | ⏱ ${
          Date.now() - start
        }ms`
      );
      return res;
    } catch (err) {
      errorLogger.error(
        `${logPrefix} ❌ | ${(err as Error).message} | ⏱ ${
          Date.now() - start
        }ms`
      );
      return this.cache.get<T>(key);
    }
  }

  async del(key: string | string[]): Promise<number> {
    const start = Date.now();
    const keys = Array.isArray(key) ? key : [key];
    const logPrefix = `[CACHE][DEL] keys:${keys.join(',')}`;

    try {
      if (this.redis) {
        const res = await this.redis.del(...keys);
        logger.info(`${logPrefix} ✅ | ⏱ ${Date.now() - start}ms`);
        return res;
      }

      const res = this.cache.del(keys);
      logger.info(`${logPrefix} ✅ (memory) | ⏱ ${Date.now() - start}ms`);
      return res;
    } catch (err) {
      errorLogger.error(
        `${logPrefix} ❌ | ${(err as Error).message} | ⏱ ${
          Date.now() - start
        }ms`
      );
      return this.cache.del(keys);
    }
  }

  async has(key: string): Promise<boolean> {
    const start = Date.now();
    const logPrefix = `[CACHE][HAS] key:${key}`;
    try {
      if (this.redis) {
        const exists = await this.redis.exists(key);
        const res = exists === 1;
        logger.info(
          `${logPrefix} ${res ? 'YES ✅' : 'NO ⚠️'} | ⏱ ${Date.now() - start}ms`
        );
        return res;
      }

      const res = this.cache.has(key);
      logger.info(
        `${logPrefix} ${res ? 'YES ✅ (memory)' : 'NO ⚠️ (memory)'} | ⏱ ${
          Date.now() - start
        }ms`
      );
      return res;
    } catch (err) {
      errorLogger.error(
        `${logPrefix} ❌ | ${(err as Error).message} | ⏱ ${
          Date.now() - start
        }ms`
      );
      return this.cache.has(key);
    }
  }

  async flush(): Promise<void> {
    const start = Date.now();
    const logPrefix = `[CACHE][FLUSH]`;
    try {
      if (this.redis) {
        await this.redis.flushdb();
        logger.info(`${logPrefix} ✅ | ⏱ ${Date.now() - start}ms`);
        return;
      }
    } catch (err) {
      errorLogger.error(
        `${logPrefix} ❌ | ${(err as Error).message} | ⏱ ${
          Date.now() - start
        }ms`
      );
    }

    this.cache.flushAll();
    logger.info(`${logPrefix} ✅ (memory) | ⏱ ${Date.now() - start}ms`);
  }

  // ------------------- Advanced Operations -------------------

  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const start = Date.now();
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const fresh = await fetchFunction();
    await this.set(key, fresh, ttl);
    logger.info(
      `[CACHE][GETORSET] key:${key} ✅ (fresh) | ⏱ ${Date.now() - start}ms`
    );
    return fresh;
  }

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
    logger.info(`[CACHE][INVALIDATE TAG] tag:${tag} deleted:${deletedCount}`);
    return deletedCount;
  }

  // ------------------- Utility -------------------

  getStats() {
    return this.cache.getStats();
  }

  getKeys(): string[] {
    return this.cache.keys();
  }

  generateCacheKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}
