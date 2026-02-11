# Welcome to Curlmate!
Drop in this code in your code to get refreshed access tokens
```
async function getAccessToken() {
  const res = await fetch("https://curlmate.dev/api/token", {
    headers: {
      Authorization: `Bearer ${process.env.CURLMATE_JWT}`,
      "x-connection": process.env.CURLMATE_CONNECTION
    }
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Usage inside your MCP server:
const { access_token } = await getAccessToken();
// use access_token to call Airtable / Google / etc
```

Postman Curl:
```
curl --location 'https://curlmate.dev/api/token' \
--header 'Authorization: Bearer CURLMATE_JWT' \
--header 'x-connection: CURLMATE_CONNECTION'
```
## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
