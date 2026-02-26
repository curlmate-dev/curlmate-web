import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getRefreshToken } from "~/utils/backend.server";
import { isApiHost } from "~/utils/get-host";

export async function loader({ params, request }: LoaderFunctionArgs) {
  if (isApiHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const { service, appHash } = params;

  if (!service || !appHash) {
    throw redirect("/404");
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

  return redirect(`/success/${service}/${appHash}`);
}
