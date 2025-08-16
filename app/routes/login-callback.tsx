import { redirect, LoaderFunctionArgs } from "@remix-run/node";
import { commitSession, getSession } from "~/utils/backend.cookie";
import { saveOrgInRedis } from "~/utils/backend.redis";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    throw redirect("/login");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.GITHUB_LOGIN_REDIRECT_URI!);
  params.append("client_id", process.env.GITHUB_LOGIN_CLIENT_ID!);
  params.append("client_secret", process.env.GITHUB_LOGIN_CLIENT_SECRET!);

  const RequestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  };
  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    RequestOptions,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("HTTP Error !", {
      cause: errorText,
    });
  }

  const tokenData = await response.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    throw redirect("/login");
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await userResponse.json();

  const rv = await saveOrgInRedis(user);

  if (typeof rv === "object" && "error" in rv) {
    return redirect("/login");
  }

  const session = await getSession(request.headers.get("Cookie"));
  session.set("orgKey", rv);

  return redirect("/org", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
