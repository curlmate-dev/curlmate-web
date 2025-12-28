import { ActionCtx } from ".";

export async function createOrUpdateSalesforceRecord(params: ActionCtx) {
  const { accessToken, input } = params;
  const response = await fetch();

  if (!response.ok) {
    return Response.json({}, {});
  }

  return await response.json();
}
