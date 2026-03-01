import { LoaderFunctionArgs } from "@remix-run/node";
import { verifyJwt } from "~/utils/backend.jwt";
import { getApp, getSessionUser } from "~/utils/backend.redis";
import { isAppHost } from "~/utils/get-host";

export async function loader({ request }: LoaderFunctionArgs) {
  if (isAppHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const jwt = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!jwt) {
    return new Response(
      JSON.stringify({
        error: "JWT token is missing",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const decodedJwt = verifyJwt(jwt);

  if (!decodedJwt) {
    return new Response(
      JSON.stringify({
        error: "Invalid JWT token",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const connection = request.headers.get("x-connection");
  if (!connection) {
    return new Response(
      JSON.stringify({
        error: "Connection header is missing",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const { sub } = decodedJwt;

  const user = await getSessionUser(`user:${sub}`);
  if (!user) {
    return new Response(
      JSON.stringify({
        error: "User not found",
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const exists = user.apps.indexOf(`app:${connection}`) !== -1;

  if (!exists) {
    return new Response(
      JSON.stringify({
        error: "User does not have access to this connection",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
  const [appHash, service] = connection.split(":");

  const app = await getApp({ appHash, service });

  return new Response(
    JSON.stringify({
      custAuthUrl: app?.custAuthUrl ?? null,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
