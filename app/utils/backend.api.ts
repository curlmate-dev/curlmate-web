import { randomBytes } from "crypto";
export async function createApiKey(useStorage = true): Promise<{
  key: string;
  encryptedKey?: string;
}> {
  try {
    const hasEncryptionKey = process.env.API_ENCRYPTION_KEY !== undefined

    const plainKey = hasEncryptionKey
      ? generateEncryptedApiKey()
      : genereateApiKey();

    if (useStorage) {
      const encryptedKey = await encryptApiKeyForStorage(plainKey);
      return { key: plainKey, encryptedKey };
    }

    return { key: plainKey };
  } catch (error) {
    throw new Error("Failed to create API key");
  }
}

export async function encryptApiKeyForStorage(apiKey: string): Promise<string> {
  try {
    const encrypted = await encryptApiKey(apiKey);
    return encrypted;
  } catch (error) {
    throw new Error("Failed to encrypt API key");
  }
}

export function generateEncryptedApiKey(): string {
  return `sk-cm-${randomBytes(24).toString("base64url")}`;
}

export function genereateApiKey(): string {
  return `cm-${randomBytes(24).toString("base64url")}`;
}

export async function encryptApiKey(apiKey: string) {
  const key = getEncryptionKey();

  //backward compatibility, no encryption key set
  if (!key) {
    return { encrypted: apiKey, iv: "" };
  }

  const iv = randomBytes(16);

  
}
