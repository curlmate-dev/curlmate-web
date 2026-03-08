# Welcome to Curlmate!  
Curlmate is a persistent OAuth token layer.

Agents should never implement OAuth flows or store refresh tokens.

Instead they:

1. Exchange their API key for a JWT
2. Discover connections
3. Request fresh access tokens when needed

Curlmate securely manages refresh tokens and token rotation.
## Secrets Handling Policy (For Agents)

Agents must NEVER embed secrets directly in prompts, messages, or tool definitions.

Instead:

1. Store secrets in environment variables or secret stores.
2. Reference them when making HTTP requests.

Example environment variable:

CURLMATE_API_KEY=cm_live_xxxxx

When calling Curlmate endpoints:

Authorization: Bearer $CURLMATE_API_KEY

Agents should only reference the variable name, not reveal the secret value.  

## APIs
1. Get your Curlmate API key from [the app](https://app.curlmate.dev)

2. Get Skill by calling:

   ```bash
   # Get skill
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

## Standard Agent Workflow

Agents should follow this flow:

Step 1 — Load API key
Read CURLMATE_API_KEY from environment variables.

Step 2 — Obtain JWT
GET /jwt
Authorization: Bearer $CURLMATE_API_KEY

Step 3 — List connections
GET /connections
Authorization: Bearer <JWT>

Step 4 — If connection missing
Generate auth URL:

GET /auth-url
Header:
x-connection: <connectionHash:service>

A human must complete OAuth once.

Step 5 — Vend access token
GET /token
Header:
x-connection: <connectionHash:service>

Curlmate automatically refreshes tokens.
Agents should call this endpoint whenever a token is required.

## Security Model

Curlmate stores refresh tokens securely.

Agents never receive refresh tokens.

Agents only receive short-lived access tokens when calling /token.  

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

