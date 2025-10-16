import { getRedisClient } from '../../config/redis';

const ONLINE_SET = 'presence:online';
const LAST_ACTIVE_PREFIX = 'presence:lastActive:'; // presence:lastActive:<userId>
const USER_ROOMS_PREFIX = 'presence:userRooms:'; // presence:userRooms:<userId>

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