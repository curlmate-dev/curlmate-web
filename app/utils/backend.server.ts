import * as path from "path";
import * as crypto from "crypto";
import fs from "fs";
import { load } from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "./backend.cookie";
import { redirect } from "@remix-run/node";
import {
  getApp,
  getFromRedis,
  saveAppForUser,
  saveAppsForOrg,
  saveInRedis,
} from "./backend.redis";
import { ServiceConfig, App, zAccessToken } from "./types";
import { z } from "zod";
import { URLSearchParams } from "url";

export function readYaml(filePath: string) {
  const absoulutePath = path.join(...[process.cwd(), "/app", filePath]);
  const fileContents = fs.readFileSync(absoulutePath, "utf-8");
  const rawConfig = load(fileContents);
  const config = ServiceConfig.parse(rawConfig);
  return config;
}

export function getAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  userSelectedScope: string;
  userInfoScope: string | undefined;
  appUuid: string;
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
    appUuid,
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
    state: `${appUuid}:${service}`,
    access_type: "offline",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const serviceConfig = readYaml(`/oauth/${service}.yaml`);
  const scope = getScopeForService({
    userInfoScope,
    userSelectedScope,
  });

  scope && params.set("scope", scope);

  getAdditionalAuthUrlParamsForService({ serviceConfig, params });

  return `${authUrl}?${params.toString()}`;
}

export async function exchangeAuthCodeForToken(opts: {
  appUuid: string;
  authCode: string;
  service: string;
}) {
  const { appUuid, service, authCode } = opts;

  const appData = await getApp({ appUuid, service });
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

  const appUuid = uuidv4();

  const serviceConfig = readYaml(`/oauth/${service}.yaml`);
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

  //always implement PKCE
  const codeVerifier = crypto.randomBytes(24).toString("hex");

  const appAuthUrl = getAuthUrl({
    clientId: CID,
    redirectUri,
    authUrl,
    userSelectedScope,
    userInfoScope,
    appUuid,
    service,
    isCurlmate,
    codeVerifier,
  });

  const appKey = `app:${appUuid}:${service}`;

  orgKey && (await saveAppsForOrg(orgKey, appKey));

  userId && !orgKey && (await saveAppForUser({ userId, appKey }));

  const curlmateCSEC =
    process.env[`CURLMATE_${service.toUpperCase().replace(/-/g, "_")}_CSEC`];

  if (!curlmateCSEC && isCurlmate) {
    throw new Error("Curlmate Client Secret Missing");
  }

  const CSEC = !isCurlmate ? clientSecret : curlmateCSEC!;

  const value: z.infer<typeof App> = {
    clientId: CID,
    clientSecret: CSEC,
    redirectUri,
    userSelectedScope,
    appAuthUrl,
    tokenUrl,
    service,
    tokens: [],
    custAuthUrl: `${origin}/oauth/${service}/${appUuid}`,
    codeVerifier,
    authTokenRequestUrlencoded,
    userInfoUrl,
    authTokenRequestParamsWithoutCSEC,
    additionalHeaders,
    refreshTokenAuthHeader,
  };

  await saveInRedis({ key: appKey, value, service });

  return appUuid;
}

export async function getRefreshToken(opts: {
  appUuid: string;
  tokenUuid: string;
  service: string;
}) {
  const { appUuid, tokenUuid, service } = opts;
  if (!appUuid) {
    throw new Error("Missing App Id");
  }

  if (!tokenUuid) {
    throw new Error("Missing Token Id");
  }

  if (!service) {
    throw new Error("Missing service name");
  }

  const res = await getFromRedis({ key: `token:${tokenUuid}`, service });

  const { expiresAt, refreshToken, user } = zAccessToken.parse(res);

  const expired = expiresAt
    ? new Date(expiresAt).getTime() < new Date().getTime()
    : undefined;

  if (!refreshToken) {
    return Response.json({
      message: "No refresh token found",
      tokenUuid,
      service,
    });
  }

  if (!expired) {
    return Response.json({
      message: "Token is not expired",
      tokenUuid,
      service,
    });
  }

  const app = await getApp({ appUuid, service });
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

  await saveInRedis({
    key: `token:${tokenUuid}`,
    value: {
      expiresAt: new Date(Date.now() + rawToken.expires_in * 1000).getTime(),
      refreshToken,
      accessToken: rawToken.access_token,
      tokenResposne: rawToken,
      user,
    },
    service,
  });

  return Response.json({
    message: "Refresh token saved successfully",
    tokenUuid,
    service,
  });
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
  serviceConfig: z.infer<typeof ServiceConfig>;
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
  appUuid: string;
  service: string;
  accessToken: string;
}) {
  const { appUuid, service, accessToken } = opts;

  const appData = await getApp({ appUuid, service });
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
  appUuid: string,
  service: string,
  user: Record<string, string>,
  tokenResponse: Record<string, unknown>,
) {
  const tokenUuid = uuidv4();
  const tokenId = `token:${tokenUuid}`;
  await saveInRedis({
    key: tokenId,
    value: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token
        ? tokenResponse.refresh_token
        : undefined,
      expiresAt: tokenResponse.expires_in
        ? new Date(
            Date.now() + Number(tokenResponse.expires_in) * 1000,
          ).getTime()
        : undefined,
      user,
      tokenResponse,
    },
    service,
  });

  const appData = await getApp({ appUuid, service });
  if (!appData) {
    throw new Error("App not found");
  }

  appData.tokens.push(tokenId);
  await saveInRedis({
    key: `app:${appUuid}:${service}`,
    value: appData,
    service,
  });

  return tokenUuid;
}
