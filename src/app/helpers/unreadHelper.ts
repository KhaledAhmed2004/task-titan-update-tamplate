import { getRedisClient } from '../../config/redis';

const CHAT_UNREAD_PREFIX = 'chat:unread_count:'; // chat:unread_count:<chatId>

const chatKey = (chatId: string) => `${CHAT_UNREAD_PREFIX}${String(chatId)}`;

export const getUnreadCountCached = async (
  chatId: string,
  userId: string
): Promise<number | null> => {
  const redis = getRedisClient();
  const v = await redis.hget(chatKey(chatId), String(userId));
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const setUnreadCount = async (
  chatId: string,
  userId: string,
  count: number
): Promise<void> => {
  const redis = getRedisClient();
  await redis.hset(chatKey(chatId), String(userId), String(count));
};

export const incrementUnreadCount = async (
  chatId: string,
  userId: string,
  delta: number
): Promise<number> => {
  const redis = getRedisClient();
  const res = await (redis as any).hincrby(chatKey(chatId), String(userId), delta);
  return typeof res === 'number' ? res : Number(res ?? 0);
};

export const clearUnreadCount = async (
  chatId: string,
  userId: string
): Promise<void> => {
  const redis = getRedisClient();
  await redis.hdel(chatKey(chatId), String(userId));
};

export const UnreadHelper = {
  getUnreadCountCached,
  setUnreadCount,
  incrementUnreadCount,
  clearUnreadCount,
};