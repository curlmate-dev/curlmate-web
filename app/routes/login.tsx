import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { isApiHost } from "~/utils/get-host";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (isApiHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_LOGIN_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_LOGIN_REDIRECT_URI!,
    scope: "read:user user:email",
    state: crypto.randomUUID().toString(),
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return redirect(authUrl);
};
