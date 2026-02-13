import { LoaderFunctionArgs } from "@remix-run/node";
import { verifyJwt } from "~/utils/backend.jwt";
import { getApp, getSessionUser } from "~/utils/backend.redis";
import { getRefreshToken } from "~/utils/backend.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authHeader = request.headers.get("Authorization");
  const jwt = authHeader?.split(" ")[1];
  if (!jwt) {
    return Response.json(
      {
        error: "No jwt found in Authorization header",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const decodedValue = verifyJwt(jwt);
    if (!decodedValue) {
      return Response.json({
        error: "JWT could not be decoded",
      });
    }
    const { sub } = decodedValue;

    const connection = request.headers.get("x-connection");
    if (!connection) {
      return Response.json("x-connection header missing");
    }

    const user = await getSessionUser(`user:${sub}`);

    if (!user) {
      return Response.json({
        error: "User not found",
      });
    }

    const [appHash, service] = connection.split(":");
    const { apps } = user;
    const appKey = `app:${appHash}:${service}`;
    const idx1 = apps?.indexOf(appKey);
    if (idx1 === -1) {
      return Response.json({
        error: "app not found",
      });
    }

    const app = await getApp({ appHash, service });
    if (!app) {
      return Response.json({
        error: "App not found",
      });
    }

    if (!app.tokenId) {
      return Response.json({
        error: "Access token not found",
      });
    }

    const res = await getRefreshToken({ appHash, service });
    return Response.json({
      accessToken: res.accessToken,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return Response.json({
      error: err.message,
    });
  }
};
