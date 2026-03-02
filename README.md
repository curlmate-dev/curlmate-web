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

## Development

Run the dev server:

```bash
npm run dev
```

## Deployment

First, build your app for production:

```bash
npm run build
```

Then run the app in production mode:

```bash
npm start
```

Now you'll need to pick a host to deploy it to.

### DID

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
