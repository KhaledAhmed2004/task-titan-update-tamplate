import { getRedisClient } from '../../config/redis';

const ONLINE_SET = 'presence:online';
const LAST_ACTIVE_PREFIX = 'presence:lastActive:'; // presence:lastActive:<userId>
const USER_ROOMS_PREFIX = 'presence:userRooms:'; // presence:userRooms:<userId>
const CONN_COUNT_PREFIX = 'presence:connCount:'; // presence:connCount:<userId>

export const setOnline = async (userId: string) => {
  const redis = getRedisClient();
  await redis.sadd(ONLINE_SET, userId);
  await redis.set(LAST_ACTIVE_PREFIX + userId, Date.now().toString());
};

export const setOffline = async (userId: string) => {
  const redis = getRedisClient();
  await redis.srem(ONLINE_SET, userId);
  await redis.set(LAST_ACTIVE_PREFIX + userId, Date.now().toString());
};

export const updateLastActive = async (userId: string) => {
  const redis = getRedisClient();
  await redis.set(LAST_ACTIVE_PREFIX + userId, Date.now().toString());
};

export const isOnline = async (userId: string) => {
  const redis = getRedisClient();
  const res = await redis.sismember(ONLINE_SET, userId);
  return res === 1;
};

export const getLastActive = async (userId: string) => {
  const redis = getRedisClient();
  const ts = await redis.get(LAST_ACTIVE_PREFIX + userId);
  return ts ? Number(ts) : undefined;
};

export const addUserRoom = async (userId: string, chatId: string) => {
  const redis = getRedisClient();
  await redis.sadd(USER_ROOMS_PREFIX + userId, chatId);
};

export const removeUserRoom = async (userId: string, chatId: string) => {
  const redis = getRedisClient();
  await redis.srem(USER_ROOMS_PREFIX + userId, chatId);
};

export const getUserRooms = async (userId: string) => {
  const redis = getRedisClient();
  return await redis.smembers(USER_ROOMS_PREFIX + userId);
};

export const clearUserRooms = async (userId: string) => {
  const redis = getRedisClient();
  await redis.del(USER_ROOMS_PREFIX + userId);
};

export const incrConnCount = async (userId: string) => {
  const redis = getRedisClient();
  return await (redis as any).incr(CONN_COUNT_PREFIX + userId);
};

export const decrConnCount = async (userId: string) => {
  const redis = getRedisClient();
  const key = CONN_COUNT_PREFIX + userId;
  const res = await (redis as any).decr(key);
  if (typeof res === 'number' && res < 0) {
    await redis.set(key, '0');
    return 0;
  }
  return typeof res === 'number' ? res : 0;
};

export const getConnCount = async (userId: string) => {
  const redis = getRedisClient();
  const v = await redis.get(CONN_COUNT_PREFIX + userId);
  return v ? Number(v) : 0;
};