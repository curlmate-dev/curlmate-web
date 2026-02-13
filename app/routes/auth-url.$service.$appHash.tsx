import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getFromRedis } from "~/utils/backend.redis";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { service, appHash } = params;

  if (!service || !appHash) {
    throw redirect("/404");
  }

  const app = await getFromRedis({ key: `app:${appHash}:${service}`, service });

  const authUrl = app.appAuthUrl;

  return redirect(authUrl);
};
