import { LoaderFunctionArgs } from "@remix-run/node";
import { CurlmateSkill } from "~/utils/backend.skill";
import { isAppHost } from "~/utils/get-host";

export async function loader({ request }: LoaderFunctionArgs) {
  if (isAppHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  return new Response(
    JSON.stringify({
      CurlmateSkill: { ...CurlmateSkill },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
