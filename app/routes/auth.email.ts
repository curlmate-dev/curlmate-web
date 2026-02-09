import { ActionFunctionArgs } from "@remix-run/node";
import { signInEmail } from "better-auth/api";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  return Response.json({});
};
