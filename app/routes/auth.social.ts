import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { createBetterAuthAuthorizationURL } from "~/utils/backend.auth";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  console.log({
    method: request.method,
    url: request.url,
    header: Object.fromEntries(request.headers),
  });
  const url = new URL(request.url);
  const service = url.searchParams.get("service");
  if (!service) {
    return redirect("/404");
  }

  const isValid = ["google", "github"].includes(service);
  if (!isValid) {
    throw new Response("Invalid provider", { status: 400 });
  }

  const authUrl = await createBetterAuthAuthorizationURL(service);
  console.log(url);
  return Response.json({});
};
