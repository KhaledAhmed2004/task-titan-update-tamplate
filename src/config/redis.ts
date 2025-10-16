import Redis from 'ioredis';
import { errorLogger, logger, notifyCritical } from '../shared/logger';
import config from '.';

let redis: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (redis) return redis;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    // Basic event logging
    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });
    redis.on('ready', () => {
      logger.info('✅ Redis ready');
    });
    redis.on('error', (err) => {
      errorLogger.error(`❌ Redis connection failed: ${err.message}`);
      notifyCritical('Redis Connection Failed', err.message);
    });
    redis.on('end', () => {
      logger.warn('⚠️ Redis connection closed');
    });

    // Instrument common commands for debugging and timing in development
    const instrument = (method: 'get' | 'set' | 'del' | 'incr') => {
      const original = (redis as any)[method].bind(redis);
      (redis as any)[method] = async (...args: any[]) => {
        const key = args[0];
        if (config.node_env === 'development') {
          logger.debug(`🔹 Redis ${method.toUpperCase()} key: ${key}`);
        }
        const start = Date.now();
        try {
          const result = await original(...args);
          const ms = Date.now() - start;
          logger.info(`⏱️ Redis command executed in ${ms}ms`);
          return result;
        } catch (err) {
          errorLogger.error(`❌ Redis ${method.toUpperCase()} failed: ${(err as Error).message}`);
          throw err;
        }
      };
    };
    instrument('get');
    instrument('set');
    instrument('del');
    instrument('incr');

    return redis;
  } catch (e) {
    errorLogger.error(`❌ Redis connection failed: ${(e as Error).message}`);
    notifyCritical('Redis Initialization Failed', (e as Error).message);
    return null;
  }
};

export const redisPing = async (): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const res = await client.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
};