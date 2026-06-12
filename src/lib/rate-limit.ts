import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.REDIS_URL;
const token = process.env.REDIS_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// 30 peticiones por minuto por identificador (IP).
const searchRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "ratelimit:becas-search",
    })
  : null;

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Si Redis no está configurado, no se aplica rate limiting (siempre success: true)
 * para no bloquear el desarrollo local sin Upstash.
 */
export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  if (!searchRatelimit) {
    return { success: true, limit: 30, remaining: 30, reset: 0 };
  }

  try {
    const { success, limit, remaining, reset } =
      await searchRatelimit.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("[rate-limit] checkRateLimit failed", error);
    return { success: true, limit: 30, remaining: 30, reset: 0 };
  }
}
