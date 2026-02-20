import { z } from "zod";

export const zOrg = z.object({
  id: z.number(),
  login: z.string(),
  avatar: z.url(),
  email: z.email().nullable(),
  apps: z.array(z.string()),
});

export type Org = z.infer<typeof zOrg>;

export const zGitUser = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.url(),
  email: z.email().nullable(),
});

export const zApp = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  userSelectedScope: z.string(),
  appAuthUrl: z.string(),
  tokenUrl: z.string(),
  service: z.string(),
  tokenId: z.string().nullable(),
  custAuthUrl: z.string(),
  codeVerifier: z.string(),
  authTokenRequestUrlencoded: z.boolean(),
  userInfoUrl: z.string().optional(),
  additionalHeaders: z.record(z.string(), z.string()).optional(),
  authTokenRequestParamsWithoutCSEC: z.boolean().optional(),
  refreshTokenAuthHeader: z.boolean(),
});

export type App = z.infer<typeof zApp>;

export const zServiceConfig = z.object({
  isProd: z.boolean().optional(),
  name: z.string(),
  authUrl: z.string(),
  tokenUrl: z.string(),
  userInfoUrl: z.string(),
  scopes: z.record(z.string(), z.string()),
  userInfoScope: z.optional(z.string()),
  additionalRequiredAuthUrlParams: z.record(z.string(), z.string()).optional(),
  additionalHeaders: z.record(z.string(), z.string()).optional(),
  authTokenRequestUrlencoded: z.boolean(),
  authTokenRequestParamsWithoutCSEC: z.boolean().optional(),
  refreshTokenAuthHeader: z.boolean(),
});

export type ServiceConfig = z.infer<typeof zServiceConfig>;
const zOauthConfig = z.object({
  authUrl: z.string(),
  tokenUrl: z.string(),
  redirectUri: z.string(),
  scopes: z.record(z.string(), z.string()),
});

export type OAuthConfig = z.infer<typeof zOauthConfig>;

export const zSessionUser = z.object({
  apps: z.array(z.string()),
});

export type SessionUser = z.infer<typeof zSessionUser>;
export const zAccessToken = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  tokenResponse: z.record(z.string(), z.unknown()),
  user: z.record(z.string(), z.unknown()),
});

export const zApiKey = z.object({
  userId: z.string(),
});

export type MCPConfig = Record<
  string,
  {
    command: "npx";
    args: string[];
  }
>;
