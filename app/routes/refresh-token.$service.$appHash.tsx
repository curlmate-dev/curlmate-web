import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getRefreshToken } from "~/utils/backend.server";

export async function loader({ params }: LoaderFunctionArgs) {
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
