import * as crypto from "crypto";
import { getSession } from "./backend.cookie";
import { redirect } from "@remix-run/node";
import {
  getApp,
  getFromRedis,
  LinkAppToOrg,
  LinkAppToUser,
  redis,
  saveInRedis,
} from "./backend.redis";
import { ServiceConfig, App, zAccessToken, zServiceConfig } from "./types";
import { URLSearchParams } from "url";
import { z } from "zod";

export async function getAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  userSelectedScope: string;
  userInfoScope: string | undefined;
  appHash: string;
  service: string;
  isCurlmate: boolean;
  codeVerifier: string;
}) {
  const {
    clientId,
    redirectUri,
    authUrl,
    userSelectedScope,
    userInfoScope,
    appHash,
    service,
    codeVerifier,
  } = opts;

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state: `${appHash}:${service}`,
    access_type: "offline",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const raw = await redis.get(`yaml:${service}`);

  const serviceConfig = zServiceConfig.parse(raw);
  const scope = getScopeForService({
    userInfoScope,
    userSelectedScope,
  });

  scope && params.set("scope", scope);

  getAdditionalAuthUrlParamsForService({ serviceConfig, params });

  return `${authUrl}?${params.toString()}`;
}

export async function exchangeAuthCodeForToken(opts: {
  appHash: string;
  authCode: string;
  service: string;
}) {
  const { appHash, service, authCode } = opts;

  const appData = await getApp({ appHash, service });
  if (!appData) {
    throw new Error("App not found");
  }
  const {
    clientId,
    clientSecret,
    redirectUri,
    tokenUrl,
    codeVerifier,
    authTokenRequestUrlencoded,
    authTokenRequestParamsWithoutCSEC,
  } = appData;

  const requestOptions = getRequestOptionsForService({
    authCode,
    clientId,
    clientSecret,
    redirectUri,
    codeVerifier,
    authTokenRequestUrlencoded,
    authTokenRequestParamsWithoutCSEC,
  });

  const response = await fetch(tokenUrl, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Http error !", {
      cause: errorText,
    });
  }

  return await response.json();
}

export async function configureApp(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  userSelectedScope: string;
  service: string;
  origin: string;
  orgKey: string | undefined;
  userId: string | undefined;
  isCurlmate: boolean;
}) {
  const {
    clientId,
    clientSecret,
    redirectUri,
    userSelectedScope,
    service,
    origin,
    orgKey,
    userId,
    isCurlmate,
  } = opts;

  const config = await redis.get(`yaml:${service}`);
  const serviceConfig = zServiceConfig.parse(config);
  const {
    authUrl,
    tokenUrl,
    userInfoScope,
    authTokenRequestUrlencoded,
    userInfoUrl,
    authTokenRequestParamsWithoutCSEC,
    additionalHeaders,
    refreshTokenAuthHeader,
  } = serviceConfig;

  const curlmateCID =
    process.env[`CURLMATE_${service.toUpperCase().replace(/-/g, "_")}_CID`];
  if (!curlmateCID && isCurlmate) {
    throw new Error("Curlmate Client ID missing");
  }

  const CID = !isCurlmate ? clientId : curlmateCID!;

  const curlmateCSEC =
    process.env[`CURLMATE_${service.toUpperCase().replace(/-/g, "_")}_CSEC`];

  if (!curlmateCSEC && isCurlmate) {
    throw new Error("Curlmate Client Secret Missing");
  }

  const CSEC = !isCurlmate ? clientSecret : curlmateCSEC!;

  const appHash = orgKey
    ? createAppHash(CID, CSEC, orgKey, userSelectedScope)
    : createAppHash(CID, CSEC, userId!, userSelectedScope);

  const appKey = `app:${appHash}:${service}`;

  const app = await getApp({ appHash, service });

  if (app) {
    return appHash;
  }

  //always implement PKCE
  const codeVerifier = crypto.randomBytes(24).toString("hex");

  const appAuthUrl = await getAuthUrl({
    clientId: CID,
    redirectUri,
    authUrl,
    userSelectedScope,
    userInfoScope,
    appHash,
    service,
    isCurlmate,
    codeVerifier,
  });

  const value: App = {
    clientId: CID,
    clientSecret: CSEC,
    redirectUri,
    userSelectedScope,
    appAuthUrl,
    tokenUrl,
    service,
    tokenId: null,
    custAuthUrl: `${origin}/auth-url/${service}/${appHash}`,
    codeVerifier,
    authTokenRequestUrlencoded,
    userInfoUrl,
    authTokenRequestParamsWithoutCSEC,
    additionalHeaders,
    refreshTokenAuthHeader,
  };

  await saveInRedis({ key: appKey, value, service });

  orgKey && (await LinkAppToOrg(orgKey, appKey));

  userId && !orgKey && (await LinkAppToUser({ userId, appKey }));

  return appHash;
}

export async function getRefreshToken(opts: {
  appHash: string;
  service: string;
}): Promise<{ accessToken: string }> {
  const { appHash, service } = opts;
  if (!appHash) {
    throw new Error("Missing App Id");
  }

  if (!service) {
    throw new Error("Missing service name");
  }

  const res = await getFromRedis({ key: `token:${appHash}`, service });

  const { expiresAt, accessToken, refreshToken, user } =
    zAccessToken.parse(res);

  const expired = expiresAt
    ? new Date(expiresAt).getTime() < new Date().getTime()
    : undefined;

  if (!refreshToken || !expired) {
    return {
      accessToken,
    };
  }

  const app = await getApp({ appHash, service });
  if (!app) {
    throw new Error("App not found");
  }
  const { tokenUrl, clientId, clientSecret, refreshTokenAuthHeader } = app;

  const params = new URLSearchParams();
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const headers: RequestInit["headers"] = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (refreshTokenAuthHeader) {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;
  } else {
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Error refreshing token", {
      cause: errorText,
    });
  }

  const rawToken = await response.json();

  const value: z.infer<typeof zAccessToken> = {
    expiresAt: new Date(Date.now() + rawToken.expires_in * 1000).getTime(),
    refreshToken: rawToken.refresh_token
      ? rawToken.refresh_token
      : refreshToken,
    accessToken: rawToken.access_token,
    tokenResponse: rawToken,
    user,
  };

  await saveInRedis({
    key: `token:${appHash}`,
    value,
    service,
  });

  return {
    accessToken: value.accessToken,
  };
}

export async function requireOrg(request: Request): Promise<string> {
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  if (!orgKey) {
    throw redirect("/");
  }
  return orgKey;
}

export function getScopeForService(opts: {
  userInfoScope: string | undefined;
  userSelectedScope: string;
}) {
  const { userInfoScope, userSelectedScope } = opts;

  const scopes = userSelectedScope ? [userSelectedScope] : [];

  userInfoScope && scopes.push(userInfoScope);

  return scopes.join(" ");
}

export function getAdditionalAuthUrlParamsForService(opts: {
  serviceConfig: ServiceConfig;
  params: URLSearchParams;
}) {
  const { serviceConfig, params } = opts;

  const { additionalRequiredAuthUrlParams } = serviceConfig;

  additionalRequiredAuthUrlParams &&
    Object.entries(additionalRequiredAuthUrlParams).forEach(([key, value]) => {
      params.set(key, value);
    });
}

export async function getUserInfo(opts: {
  appHash: string;
  service: string;
  accessToken: string;
}) {
  const { appHash, service, accessToken } = opts;

  const appData = await getApp({ appHash, service });
  if (!appData) {
    throw new Error("App not found");
  }
  const { userInfoUrl, additionalHeaders } = appData;

  if (!userInfoUrl) {
    return {};
  }
  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  };

  requestOptions.headers = { ...requestOptions.headers, ...additionalHeaders };
  const userInfoRes = await fetch(userInfoUrl, requestOptions);

  const userInfo = !userInfoRes.ok
    ? await userInfoRes.text()
    : await userInfoRes.json();

  return userInfo;
}

function getRequestOptionsForService(opts: {
  authCode: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
  authTokenRequestUrlencoded: boolean;
  authTokenRequestParamsWithoutCSEC: boolean | undefined;
}): RequestInit {
  const {
    authCode,
    clientId,
    clientSecret,
    redirectUri,
    codeVerifier,
    authTokenRequestUrlencoded,
    authTokenRequestParamsWithoutCSEC,
  } = opts;

  if (authTokenRequestUrlencoded) {
    const params = new URLSearchParams();
    const headers: RequestInit["headers"] = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };
    params.append("grant_type", "authorization_code");
    params.append("code", authCode);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("code_verifier", codeVerifier);
    if (authTokenRequestParamsWithoutCSEC) {
      params.delete("client_secret");
      headers["Authorization"] =
        `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    }
    return {
      method: "POST",
      headers,
      body: params.toString(),
    };
  } else {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    return {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        code: authCode,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    };
  }
}

export async function saveToken(
  appHash: string,
  service: string,
  user: Record<string, string>,
  tokenResponse: Record<string, unknown>,
) {
  const appData = await getApp({ appHash, service });
  if (!appData) {
    throw new Error("App not found");
  }

  const tokenId = `token:${appHash}`;

  const exisitingToken = await getFromRedis({ key: tokenId, service });

  const value: z.infer<typeof zAccessToken> = {
    accessToken: tokenResponse.access_token as string,
    refreshToken: tokenResponse.refresh_token
      ? (tokenResponse.refresh_token as string)
      : exisitingToken?.refreshToken,
    expiresAt: tokenResponse.expires_in
      ? new Date(Date.now() + Number(tokenResponse.expires_in) * 1000).getTime()
      : undefined,
    user,
    tokenResponse,
  };

  await saveInRedis({
    key: tokenId,
    value,
    service,
  });

  await saveInRedis({
    key: `app:${appHash}:${service}`,
    value: {
      ...appData,
      tokenId,
    },
    service,
  });
  //token id token:appHash
  return appHash;
}

function createAppHash(
  cid: string,
  csec: string,
  userId: string,
  scope: string | undefined,
) {
  const parts = [cid, csec, userId, scope];
  return crypto.createHash("md5").update(parts.join("|")).digest("hex");
}

export async function buildCaludeConfig(apps: string[], accessToken: string) {
  const entries = await Promise.all(
    apps.map(async (appKey) => {
      const [, appHash, service] = appKey.split(":");
      const xConnection = `${appHash}:${service}`;
      return [
        service,
        {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            `https://${service}-mcp.curlmate.workers.dev/mcp`,
            "--header",
            `access-token: ${accessToken}`,
            "--header",
            `x-connection: ${xConnection}`,
          ],
        },
      ];
    }),
  );

  return Object.fromEntries(entries.filter(Boolean));
}
