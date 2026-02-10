export async function createApiKey(useStorage= true ): Promise<{
  key : string
  encryptedKey?: string    
}> {
  try {
    const hasEncryptionKey = process.env.API_ENCRYPTION_KEY !== undefined

    const plainKey = hasEncryptionKey ? generateEncryptedApiKey() : genereateApiKey();

    if(useStorage) {
      const encryptedKey = await encryptApiKeyForStorage(plainKey);
      return { key: plainKey, encryptedKey};
    }

    return { key: plainKey };
  } catch (error) {
    throw new Error("Failed to create API key");
  }
}

export async function encryptApiKeyForStorage(apiKey: string): Promise<string> {
  try {
    const { encrypted } = await encryptApiKeyForStorage(apiKey);
    return encrypted;
  } catch (error) {
    throw new Error("Failed to encrypt API key");
  }
}

