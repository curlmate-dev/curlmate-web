import { createAuthorizationURL } from "better-auth";
import type { ProviderOptions } from "better-auth";
import { z } from "zod";

export async function createBetterAuthAuthorizationURL(service: string) {
  const clientId = process.env[`${service.toUpperCase()}_LOGIN_CLIENT_ID`];
  let x: ProviderOptions;

  if (!clientId) {
    throw new Error(`${service} client ID not found`);
  }

  return await createAuthorizationURL({
    id: clientId,
    options: {

    }
  })
}