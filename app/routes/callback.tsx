import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  exchangeAuthCodeForToken,
  getUserInfo,
  saveToken,
} from "~/utils/backend.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const authCode = url.searchParams.get("code");
  const [appUuid, service] = url.searchParams.get("state")?.split(":") ?? [];

  if (authCode) {
    try {
      const tokenResponse = await exchangeAuthCodeForToken({
        appUuid,
        authCode,
        service,
      });

      const user = await getUserInfo({
        appUuid,
        service,
        accessToken: tokenResponse.access_token,
      });

      const tokenUuid = await saveToken(appUuid, service, user, tokenResponse);

      return redirect(`/success/${service}/${tokenUuid}`);
    } catch (error: unknown) {
      const err = error as Error;

      return Response.json(
        {
          error: err.message,
          cause: err.cause,
        },
        {
          status: 400,
        },
      );
    }
  } else {
    return Response.json({ error: "Auth Code missing" });
  }
}
