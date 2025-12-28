import { actions } from "../actions";
import { getApiKeyUser, getFromRedis, getSessionUser } from "./backend.redis";

export function parseHookHeaders(headers: Record<string, any>): {
  authHeader: string;
  serviceHeader: string;
  appIdHeader: string;
  accessTokenHeader: string;
} | null {
  const authHeader = headers["Authorization"];
  const serviceHeader = headers["X-Service-Key"];
  const appIdHeader = headers["X-App-Id"];
  const accessTokenHeader = headers["X-Access-Token-Id"];

  if (!authHeader || !serviceHeader || !appIdHeader || !accessTokenHeader) {
    return null;
  }

  return { authHeader, serviceHeader, appIdHeader, accessTokenHeader };
}

export async function validateHeaders(params: {
  authHeader: string;
  serviceHeader: string;
  appIdHeader: string;
  accessTokenHeader: string;
}): Promise<{ success: boolean; error?: string }> {
  const { authHeader, serviceHeader, appIdHeader, accessTokenHeader } = params;

  try {
    if (!authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Auth Header Doesn't start with 'Bearer '",
      };
    }

    const apiKey = authHeader.split(" ")[1];

    if (!apiKey) {
      return { success: false, error: "Missing Api Key" };
    }

    const userId = await getApiKeyUser(apiKey);

    if (!userId) {
      return { error: "User Id not found for Api Key", success: false };
    }

    const user = await getSessionUser(`user:${userId}`);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const appKey = `app:${appIdHeader}:${serviceHeader}`;
    const appExists = user?.apps.find((v) => v === appKey);
    if (!appExists) {
      return { success: false, error: "App not found for user" };
    }

    const app = await getFromRedis({ key: appKey, service: serviceHeader });
    if (!app) {
      return { success: false, error: "App not found" };
    }

    const accessTokenKey = `token:${accessTokenHeader}`;
    const accessTokenExists = app?.tokens.find((v) => v === accessTokenKey);
    if (!accessTokenExists) {
      return { success: false, error: "Access token not found for user" };
    }

    const accessToken = await getFromRedis({
      key: accessTokenKey,
      service: serviceHeader,
    });

    if (!accessToken) {
      return { success: false, error: "Access token not found" };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: "unknown" };
  }
}

export async function executeActionForHook(params: {
  key: string;
  input: string;
  accessToken: string;
}) {
  const { key, input, accessToken } = params;

  const fn = actions[key];

  if (!fn) {
    return Response.json({}, {});
  }

  const ctx = {
    accessToken,
    input,
  };

  return await fn(ctx);
}
