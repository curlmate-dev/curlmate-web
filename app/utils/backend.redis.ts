import { Redis } from "@upstash/redis";
import {
  App,
  zGitUser,
  zOrg,
  zSessionUser,
  SessionUser,
  zApiKey,
  Org,
} from "./types";
import { encrypt, decrypt } from "./backend.encryption";
import { zAppCompat } from "./backend.migration";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export { redis };

export async function getFromRedis(opts: { key: string; service?: string }) {
  const { key, service } = opts;

  const value = (await redis.get(key)) as string;

  if (!value) {
    return null;
  }

  if (!service) {
    return value;
  }

  const encryptionKey =
    process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];
  const decryptedValue = JSON.parse(
    decrypt(value, Buffer.from(encryptionKey!, "base64url")),
  );

  return decryptedValue;
}

export async function saveInRedis(opts: {
  key: string;
  value: string | object;
  service?: string;
}) {
  const { key, value, service } = opts;
  if (!service) {
    return await redis.set(key, value);
  }

  const encryptionKey =
    process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];

  const stringifiedValue =
    typeof value === "object" ? JSON.stringify(value) : value;
  const encryptedValue = encrypt(
    stringifiedValue,
    Buffer.from(encryptionKey!, "base64url"),
  );

  await redis.set(key, encryptedValue);
}

export async function saveOrgInRedis(data: object) {
  const org = zGitUser.parse(data);
  if ("login" in org) {
    const redisKey = `org:${org.login}`;
    const existing = await redis.get(redisKey);
    if (!existing) {
      await redis.set(
        redisKey,
        JSON.stringify({
          id: org.id,
          login: org.login,
          avatar: org.avatar_url,
          email: org.email,
          apps: [],
        }),
      );
    }
    return redisKey;
  } else {
    return {
      error: "Email not received from Github",
    };
  }
}

export async function getAppsForOrg(orgKey: string): Promise<string[] | null> {
  const rawOrg = await redis.get(orgKey);

  if (!rawOrg) {
    return null;
  }

  const org = zOrg.parse(rawOrg);
  const apps = org.apps;
  return apps;
}

export async function getAppsForUser(userId: string): Promise<string[] | null> {
  const rawUser = await redis.get(userId);

  if (!rawUser) {
    return null;
  }

  const user = zSessionUser.parse(rawUser);
  const apps = user.apps;
  return apps;
}

export async function LinkAppToOrg(
  orgKey: string,
  appKey: string,
): Promise<Org | null> {
  const rawOrg = await redis.get(orgKey);

  if (!rawOrg) {
    return null;
  }

  const org = zOrg.parse(rawOrg);
  const idx = org.apps.indexOf(appKey);
  if (idx === -1) {
    org.apps.push(appKey);
    await redis.set(orgKey, org);
  }
  return org;
}

export async function getOrg(orgKey: string): Promise<Org | null> {
  const rawOrg = await redis.get(orgKey);

  if (!rawOrg) {
    return null;
  }

  const org = zOrg.parse(rawOrg);
  return org;
}

export async function getApp(opts: {
  appHash: string;
  service: string;
}): Promise<App | null> {
  const { appHash, service } = opts;
  const rawApp = (await redis.get(`app:${appHash}:${service}`)) as string;
  if (!rawApp) {
    return null;
  }

  const encryptionKey =
    process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];
  const decryptedApp = JSON.parse(
    decrypt(rawApp, Buffer.from(encryptionKey!, "base64url")),
  );

  //zAppCompat repairs data by allowing older connections with string type scope to string[] type scope
  const result = zAppCompat.safeParse(decryptedApp);
  if (!result.success) {
    return null;
  }

  const app = result.data;

  // this may never run again as it repairs older apps with string type scope to string[] scope
  if (typeof decryptedApp.userSelectedScope === "string") {
    const repairedCipher = encrypt(
      JSON.stringify(app),
      Buffer.from(encryptionKey!, "base64url"),
    );
    await redis.set(`app:${appHash}:${service}`, repairedCipher);
  }

  return app;
}

export async function createUserFromSession(sessionUserId: string) {
  await redis.setnx(`user:${sessionUserId}`, {
    rateLimitTier: "free",
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    apps: [],
  });
}

export async function LinkAppToUser(opts: {
  userId: string;
  appKey: string;
}): Promise<SessionUser | null> {
  const { userId, appKey } = opts;
  const rawUser = await redis.get(`user:${userId}`);

  const user = zSessionUser.parse(rawUser);
  const idx = user.apps.indexOf(appKey);
  if (idx === -1) {
    user.apps.push(appKey);
    await redis.set(`user:${userId}`, user);
  }
  return user;
}

export async function getSessionUser(userId: string) {
  const rawUser = await redis.get(userId);

  if (!rawUser) {
    return null;
  }

  const sessionUser = zSessionUser.parse(rawUser);
  return sessionUser;
}

export async function getUserForApiKey(apiKey: string) {
  const rawApiKey = await redis.get(apiKey);

  if (!rawApiKey) {
    return null;
  }

  const parsed = zApiKey.parse(rawApiKey);
  return parsed;
}

export function getMonthKeyUTC() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function secondsUntilNextMonthUTC() {
  const now = new Date();

  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return Math.floor((nextMonth.getMonth() - now.getMonth()) / 1000);
}

export async function consumeUsage(userId: string) {
  const usageKey = `usage:user:${userId}:${getMonthKeyUTC()}`;
  const count = await redis.incr(usageKey);

  if (count === 1) {
    await redis.expire(usageKey, secondsUntilNextMonthUTC());
  }

  return count;
}
