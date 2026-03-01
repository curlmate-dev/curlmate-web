import { isAppHost } from "~/utils/get-host";
import { LoaderFunctionArgs } from "@remix-run/node";
import { verifyJwt } from "~/utils/backend.jwt";
import { getSessionUser } from "~/utils/backend.redis";

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

  const connections = user.apps.map((app) => {
    const [, appHash, service] = app.split(":");
    return {
      id: appHash,
      service: service,
    };
  });

  return new Response(
    JSON.stringify({
      connections: connections,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
