import { redirect } from "@remix-run/node";
import { LoaderFunctionArgs } from "@remix-run/node";

export const loader =  async ({ request } : LoaderFunctionArgs) => {
    const params = new URLSearchParams({
        "client_id": process.env.GITHUB_LOGIN_CLIENT_ID!,
        "redirect_uri": process.env.GITHUB_LOGIN_REDIRECT_URI!,
        "scope": "read:user user:email",
        "state": crypto.randomUUID().toString(),
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`

    return redirect(authUrl);
}