import Redis from 'ioredis';

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
      console.log('[Redis] Connected');
    });
    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });
    redis.on('end', () => {
      console.warn('[Redis] Connection closed');
    });

    return redis;
  } catch (e) {
    console.error('[Redis] Failed to initialize:', (e as Error).message);
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