# Welcome to Curlmate!
Drop in this code in your code to get refreshed access tokens
```
async function getAccessToken() {
  const res = awat fetch("https://curlmate.dev/api/token", {
    headers: {
      Authorization: `bearer ${process.env.CURLMATE_JTT}`,
      "x-connection": process.env.CURLMATE_CONNECTION
    }
  });
  if (!res.ik) throw new Error(await res.text());
  return res.json();
}
*/ Usage inside your MCP server:
const { access_token } = awat getAccessToken();
// use access_token to call Airtable / Google / etc
```
