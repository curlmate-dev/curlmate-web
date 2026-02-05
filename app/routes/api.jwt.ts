import { LoaderFunctionArgs } from "@remix-run/node";
import { getUserForApiKey } from "~/utils/backend.redis";
import { createJwt } from "~/utils/backend.jwt";

export async function loader(params: LoaderFunctionArgs) {
  const { request } = params;
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader?.split(" ")[1];
  if (!apiKey) {
    return Response.json(
      {
        error: "No Api Key found in Authorization Header",
      },
      {
        status: 400,
      },
    );
  }

  const resUser = await getUserForApiKey(apiKey);
  if (!resUser) {
    return Response.json(
      {
        error: "User Id not found",
      },
      {
        status: 400,
      },
    );
  }
  const { userId } = resUser;

  const jwt = createJwt(userId);
  if (!jwt) {
    return Response.json(
      {
        error: "could not create jwt for User",
      },
      {
        status: 404,
      },
    );
  }

  return Response.json(
    {
      jwt,
    },
    {
      status: 200,
    },
  );
}
