import { LoaderFunctionArgs } from "@remix-run/node";
import {
  executeActionForHook,
  parseHookHeaders,
  validateHeaders,
} from "~/utils/backend.hook";
import { getFromRedis } from "~/utils/backend.redis";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { name } = params;

  const parsedHeaders = parseHookHeaders(request.headers);
  if (!parsedHeaders) {
    return Response.json({}, {});
  }

  const { success, error } = await validateHeaders(parsedHeaders);
  if (!success) {
    return Response.json({ error }, { status: 200 });
  }

  const { accessTokenHeader, serviceHeader } = parsedHeaders;
  const accessToken = await getFromRedis({
    key: `token:${accessTokenHeader}`,
    service: serviceHeader,
  });

  const input = JSON.stringify(request.body);

  const response = executeActionForHook({
    key: name!,
    input,
    accessToken,
  });

  return response;
};
