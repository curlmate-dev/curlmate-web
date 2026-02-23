import { LoaderFunctionArgs } from "@remix-run/node";
import { verifyJwt } from "~/utils/backend.jwt";
import { getSessionUser } from "~/utils/backend.redis";
import { buildCaludeConfig } from "~/utils/backend.server";
import { isAppHost } from "~/utils/get-host";

export async function loader({ request }: LoaderFunctionArgs) {
  if (isAppHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const authHeader = request.headers.get("Authorization");
  const jwt = authHeader?.split(" ")[1];

  if (!jwt) {
    return Response.json(
      {
        error: "No jwt found in authorization header",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const decodedValue = verifyJwt(jwt);
    if (!decodedValue) {
      return Response.json(
        {
          error: "jwt could not be dcoded",
        },
        {
          status: 400,
        },
      );
    }

    const { sub } = decodedValue;

    const user = await getSessionUser(`user:${sub}`);
    if (!user) {
      return Response.json(
        {
          error: "user not found",
        },
        {
          status: 400,
        },
      );
    }

    const mcpServers = await buildCaludeConfig(user.apps, jwt);

    return Response.json(
      {
        mcpServers,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const err = error as Error;
    return Response.json({
      error: err.message,
    });
  }
}
