import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getFromRedis } from "~/utils/backend.redis";
import { isApiHost } from "~/utils/get-host";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (isApiHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const { service, appHash } = params;

  if (!service || !appHash) {
    throw redirect("/404");
  }

  const app = await getFromRedis({ key: `app:${appHash}:${service}`, service });

  const authUrl = app.appAuthUrl;

  return redirect(authUrl);
};
