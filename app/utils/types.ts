import { z } from "zod";

export const Org = z.object({
  id: z.number(),
  login: z.string(),
  avatar: z.url(),
  email: z.email().nullable(),
  apps: z.array(z.string()),
});

export const GitUser = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.url(),
  email: z.email().nullable(),
});

export const App = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  scopes: z.string(),
  appAuthUrl: z.string(),
  tokenUrl: z.string(),
  service: z.string(),
  tokens: z.array(z.string()),
  custAuthUrl: z.string(),
});

export const UserInfo = z.object({
  email: z.email(),
});

export const ServiceConfig = z.object({
  name: z.string(),
  authUrl: z.string(),
  tokenUrl: z.string(),
  userInfoUrl: z.string(),
  scopes: z.record(z.string(), z.string()),
  userInfoScope: z.optional(z.string()),
  additionalRequired: z.record(z.string(), z.string()).optional(),
  additionalHeaders: z.record(z.string(), z.string()).optional(),
});

const OauthConfig = z.object({
  authUrl: z.string(),
  tokenUrl: z.string(),
  redirectUri: z.string(),
  scopes: z.record(z.string(), z.string()),
});

export type OAuthConfig = z.infer<typeof OauthConfig>;

export const SessionUser = z.object({
  apps: z.array(z.string()),
});
