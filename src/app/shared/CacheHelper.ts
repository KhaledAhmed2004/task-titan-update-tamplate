import NodeCache from 'node-cache';

export interface ICacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // Check period for expired keys
}

export class CacheHelper {
  private static instance: CacheHelper;
  private cache: NodeCache;

  private constructor(options: ICacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 600, // Default 10 minutes
      checkperiod: options.checkperiod || 120, // Check every 2 minutes
      useClones: false
    });
  }

  public static getInstance(options?: ICacheOptions): CacheHelper {
    if (!CacheHelper.instance) {
      CacheHelper.instance = new CacheHelper(options);
    }
    return CacheHelper.instance;
  }

  // Basic cache operations
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 0);
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  // Advanced operations
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFunction();
    this.set(key, fresh, ttl);
    return fresh;
  }

  // Cache with tags for group invalidation
  setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): boolean {
    const success = this.set(key, value, ttl);
    if (success) {
      // Store tag associations
      tags.forEach(tag => {
        const tagKey = `tag:${tag}`;
        const taggedKeys = this.get<string[]>(tagKey) || [];
        if (!taggedKeys.includes(key)) {
          taggedKeys.push(key);
          this.set(tagKey, taggedKeys);
        }
      });
    }
    return success;
  }

  invalidateByTag(tag: string): number {
    const tagKey = `tag:${tag}`;
    const taggedKeys = this.get<string[]>(tagKey) || [];
    const deletedCount = this.del(taggedKeys);
    this.del(tagKey);
    return deletedCount;
  }

  // Common cache patterns
  cacheUserData<T>(userId: string, data: T, ttl: number = 1800): boolean {
    return this.setWithTags(`user:${userId}`, data, ['users'], ttl);
  }

  cacheTaskData<T>(taskId: string, data: T, ttl: number = 900): boolean {
    return this.setWithTags(`task:${taskId}`, data, ['tasks'], ttl);
  }

  cacheCategoryData<T>(categoryId: string, data: T, ttl: number = 3600): boolean {
    return this.setWithTags(`category:${categoryId}`, data, ['categories'], ttl);
  }

  cacheSearchResults<T>(searchKey: string, results: T, ttl: number = 300): boolean {
    return this.setWithTags(`search:${searchKey}`, results, ['search'], ttl);
  }

  // Invalidation helpers
  invalidateUser(userId: string): number {
    return this.del(`user:${userId}`);
  }

  invalidateTask(taskId: string): number {
    return this.del(`task:${taskId}`);
  }

  invalidateAllUsers(): number {
    return this.invalidateByTag('users');
  }

  invalidateAllTasks(): number {
    return this.invalidateByTag('tasks');
  }

  invalidateAllCategories(): number {
    return this.invalidateByTag('categories');
  }

  invalidateAllSearches(): number {
    return this.invalidateByTag('search');
  }

  // Statistics
  getStats() {
    return this.cache.getStats();
  }

  getKeys(): string[] {
    return this.cache.keys();
  }

  // Utility methods
  generateCacheKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  // Middleware for Express
  cacheMiddleware(ttl: number = 300) {
    return (req: any, res: any, next: any) => {
      const key = this.generateCacheKey('route', req.originalUrl);
      const cached = this.get(key);

      if (cached) {
        return res.json(cached);
      }

      const originalSend = res.json;
      res.json = (data: any) => {
        this.set(key, data, ttl);
        return originalSend.call(res, data);
      };

      next();
    };
  }
}