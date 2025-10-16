import type { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { getRedisClient } from '../../config/redis';
import { logger } from '../../shared/logger';

type KeyResolver = (req: Request) => string;

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyResolver?: KeyResolver;
  routeName?: string;
}

const memory = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  const { windowMs, max, keyResolver, routeName } = options;
  const redis = getRedisClient();

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyResolver ? keyResolver(req) : req.ip;
    const key = `ratelimit:${routeName || req.path}:${identifier}`;

    try {
      if (redis) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        if (count > max) {
          logger.warn(`⚠️ Rate limit exceeded for IP: ${identifier} on route: ${routeName || req.path}`);
          return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
          });
        }
        logger.info(`✅ RateLimit applied for IP: ${identifier}`);
        return next();
      }

      // Fallback: in-memory counter
      const current = (memory.get<number>(key) || 0) + 1;
      memory.set(key, current, Math.ceil(windowMs / 1000));
      if (current > max) {
        logger.warn(`⚠️ Rate limit exceeded for IP: ${identifier} on route: ${routeName || req.path}`);
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
        });
      }
      logger.info(`✅ RateLimit applied for IP: ${identifier}`);
      return next();
    } catch (e) {
      // On any error, allow request but log
      logger.warn(`⚠️ RateLimit error: ${(e as Error).message}`);
      return next();
    }
  };
};