import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { userSession, flowSession } from "~/utils/backend.cookie";
import { getRefreshToken } from "~/utils/backend.server";
import { isApiHost } from "~/utils/get-host";
import { userOwnsApp } from "~/utils/backend.redis";

export async function loader({ params, request }: LoaderFunctionArgs) {
  if (isApiHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const cookieHeader = request.headers.get("Cookie");
  const { userId } = (await userSession.parse(cookieHeader)) || {};
  const flow = await flowSession.parse(cookieHeader);

  if (!userId || !flow) {
    return redirect("/");
  }

  const { service, appHash } = params;

  if (!service || !appHash) {
    throw redirect("/404");
  }

  const ownsApp = await userOwnsApp({ userId, appHash, service });
  if (!ownsApp) {
    return redirect("/");
  }

  try {
    await getRefreshToken({ appHash, service });
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

  return redirect(`/oauth-token/${service}/${appHash}`);
}
