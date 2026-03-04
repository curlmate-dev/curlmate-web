import { LoaderFunctionArgs } from "@remix-run/node";
import { verifyJwt } from "~/utils/backend.jwt";
import { getSessionUser } from "~/utils/backend.redis";
import { buildOpenCodeConfig } from "~/utils/backend.server";
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

  try {
    const mcp = await buildOpenCodeConfig(user.apps, jwt);

    return Response.json(
      {
        $schema: "https://opencode.ai/config.json",
        mcp,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const err = error as Error;
    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      },
    );
  }
}
