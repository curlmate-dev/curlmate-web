import { Redis } from "@upstash/redis";
import { App, GitUser, Org } from "./types";
import { z } from "zod";
import { encrypt, decrypt } from "./backend.encryption";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getFromRedis(opts: { key: string; service: string }) {
  const { key, service } = opts;

  const value = (await redis.get(key)) as string;

  if (!value) {
    return null;
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
  service: string;
}) {
  const { key, value, service } = opts;
  const encryptionKey =
    process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];

  const stringifiedValue =
    typeof value === "object" ? JSON.stringify(value) : value;
  const encryptedValue = encrypt(
    stringifiedValue,
    Buffer.from(encryptionKey!, "base64url"),
  );

  await redis.set(key, encryptedValue, { ex: 86400 });
}

export async function saveOrgInRedis(data: object) {
  const org = GitUser.parse(data);
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
        {
          ex: 86400,
        },
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

  const org = Org.parse(rawOrg);
  const apps = org.apps;
  return apps;
}

export async function saveAppsForOrg(
  orgKey: string,
  appKey: string,
): Promise<z.infer<typeof Org> | null> {
  const rawOrg = await redis.get(orgKey);

  if (!rawOrg) {
    return null;
  }

  const org = Org.parse(rawOrg);
  org.apps.push(appKey);
  await redis.set(orgKey, org);

  return org;
}

export async function getOrg(
  orgKey: string,
): Promise<z.infer<typeof Org> | null> {
  const rawOrg = await redis.get(orgKey);

  if (!rawOrg) {
    return null;
  }

  const org = Org.parse(rawOrg);
  return org;
}

export async function getApp(opts: {
  appUuid: string;
  service: string;
}): Promise<z.infer<typeof App> | null> {
  const { appUuid, service } = opts;
  const rawApp = (await redis.get(`app:${appUuid}:${service}`)) as string;
  if (!rawApp) {
    return null;
  }

  const encryptionKey =
    process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];
  const decryptedApp = JSON.parse(
    decrypt(rawApp, Buffer.from(encryptionKey!, "base64url")),
  );
  const app = App.parse(decryptedApp);
  return app;
}
