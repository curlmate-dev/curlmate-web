# Welcome to Curlmate!

## Agent Usage Instruction
1. Get your Curlmate API key from [the app](https://app.curlmate.dev)

2. Get Skill by calling:

   ```bash
   # Get JWT
   curl -s  https://api.curlmate.dev/skill
   ```


3. Exchange API key for JWT by calling:

   ```bash
   # Get JWT
   curl -s -H "Authorization: Bearer <api-key>" https://api.curlmate.dev/jwt
   ```

4. List connections by calling:

   ```bash
   # List connections
   curl -s -H "Authorization: Bearer <jwt>" https://api.curlmate.dev/connections
   ```

   Response:
   ```json
   {
     "connections":[
       {"id":"abcdef1234567890","service":"google-calendar"},
       {"id":"defghijklmnopqrst","service":"google-drive"},
       {"id":"slack-hishoclehkgljs","service":"slack"}
     ]
   }
   ```

5. Directly use the connection id with service format as x-connection header to get access token:

   ```bash
   # Get access token
   curl -s -H "Authorization: Bearer <jwt>" -H "x-connection: <connection-id>:<service>" https://api.curlmate.dev/token
   ```

   Response:
   ```json
   {"accessToken":"<access-token>"}
   ```

---

## getAccessToken Helper to use in your code

```typescript
import { z } from "zod";

const CURLMATE_BASE_URL = "https://api.curlmate.dev";

const zAccessTokenResponse = z.object({
  accessToken: z.string()
})

// ...

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

