import { createClient, RedisClientType } from "redis";
import config from "../config";

let client: RedisClientType | null = null;

const buildRedisUrl = (): string | null => {
  if (config.redis.redis_url) return config.redis.redis_url;
  if (!config.redis.redis_host) return null;

  const auth =
    config.redis.redis_username && config.redis.redis_password
      ? `${config.redis.redis_username}:${config.redis.redis_password}@`
      : config.redis.redis_password
        ? `:${config.redis.redis_password}@`
        : "";

  const port = config.redis.redis_port || "6379";
  return `redis://${auth}${config.redis.redis_host}:${port}`;
};

export const getRedis = async (): Promise<RedisClientType | null> => {
  const url = buildRedisUrl();
  if (!url) return null;

  try {
    if (!client) {
      client = createClient({ url });
      client.on("error", () => undefined);
    }
    if (!client.isOpen) {
      await client.connect();
    }
    return client;
  } catch {
    return null;
  }
};

export const pingRedis = async (): Promise<{ ok: boolean; message: string }> => {
  const redis = await getRedis();
  if (!redis) {
    return { ok: false, message: "not configured" };
  }
  try {
    const pong = await redis.ping();
    return { ok: pong === "PONG", message: pong };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
};
