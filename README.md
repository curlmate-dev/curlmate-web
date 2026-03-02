# Welcome to Curlmate!

Drop in this code in your code to get refreshed access tokens

```typescript
import { z } from "zod";

const CURLMATE_BASE_URL = "https://api.curlmate.dev";

const zAccessTokenResponse = z.object({
  accessToken: z.string()
})

const getAccessToken = async({jwt, connection}: {jwt: string | undefined, connection: string | undefined}) : Promise<{accessToken: string} | { error: string, status: number }> => {
  if (!jwt) {
    return {
      error: "Missing JWT token in Authorization header",
      status: 401
    }
  }
  if (!connection) {
    return {
      error: "Missing x-connection header",
      status: 400
    }
  }
  const response = await fetch(`${CURLMATE_BASE_URL}/token`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "x-connection": connection
    }
  })

  if (!response.ok) {
    return {
      error: await response.text(),
      status: response.status
    }
  }

  const data = zAccessTokenResponse.parse(await response.json());
  return {
    accessToken: data.accessToken
  }
}
```

## Getting Started

See above for how to use the getAccessToken helper.
