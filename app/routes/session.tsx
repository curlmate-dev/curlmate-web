import { LoaderFunctionArgs } from "@remix-run/node";
import { userSession } from "~/utils/backend.cookie";
import { getApp, getSessionUser } from "~/utils/backend.redis";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const { userId } = await userSession.parse(cookieHeader);

  const sessionUser = await getSessionUser(`user:${userId}`);
  const appKeys = sessionUser?.apps || [];

  const appPromises = appKeys.map(async (appKey) => {
    const [, appHash, service] = appKey.split(":");
    const app = await getApp({ appHash, service });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clientSecret, appAuthUrl, ...safeApp } = app || {};
    return {
      [appKey]: safeApp,
    };
  });

  const apps = await Promise.all(appPromises);

  return Response.json({ sessionUser, apps });
};
