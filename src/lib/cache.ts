import { Redis } from "@upstash/redis";

const url = process.env.REDIS_URL;
const token = process.env.REDIS_TOKEN;

// Si Redis no está configurado, todas las funciones degradan a no-op
// y el resto de la app sigue funcionando sin caché.
const redis = url && token ? new Redis({ url, token }) : null;

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error("[cache] getCached failed", error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[cache] setCached failed", error);
  }
}

export async function invalidateCache(prefix: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("[cache] invalidateCache failed", error);
  }
}
