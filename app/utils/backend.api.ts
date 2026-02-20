import { randomBytes, createHash } from "crypto";
import { getFromRedis, saveInRedis, redis } from "./backend.redis";

export interface ApiKeyData {
  userId: string;
  name: string;
  createdAt: number;
  updateAt: number;
  env: string;
  status: string;
  rateLimitTier: string;
  monthlyUsage: number;
}

export async function createApiKey(name: string, userId: string) {
  const plainKey = `cm_${randomBytes(12).toString("base64url")}`;

  const hashedKey = createHash("sha256").update(plainKey).digest("hex");

  const value: ApiKeyData = {
    userId,
    name,
    createdAt: new Date().getTime(),
    updateAt: new Date().getTime(),
    env: "live",
    status: "active",
    rateLimitTier: "free",
    monthlyUsage: 0,
  };

  await saveInRedis({ key: hashedKey, value });

  const userKeysKey = `user:${userId}:apikeys`;
  await redis.smembers(userKeysKey);
  await redis.sadd(userKeysKey, hashedKey);

  return { plainKey, hashedKey };
}

export async function listApiKeys(userId: string): Promise<ApiKeyData[]> {
  const userKeysKey = `user:${userId}:apikeys`;
  const keyHashes = await redis.smembers(userKeysKey);

  const keysWithData = await Promise.all(
    keyHashes.map(async (keyHash) => {
      const data = await getFromRedis({ key: keyHash });
      return { keyHash, ...data };
    }),
  );

  return keysWithData as ApiKeyData[];
}

export async function deleteApiKey(keyHash: string, userId: string) {
  const userKeysKey = `user:${userId}:apikeys`;
  await redis.srem(userKeysKey, keyHash);
  await redis.del(keyHash);
}

export async function authenticateApiKey(apiKey: string) {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");
  const value = (await getFromRedis({ key: hashedKey })) as ApiKeyData | null;

  if (!value) {
    throw new Error("Api Key not found");
  }

  return value.userId;
}
