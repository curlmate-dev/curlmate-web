import { ActionCtx } from ".";

export async function sendSlackMessage(params: ActionCtx) {
  const { input, accessToken } = params;

  const url = "https://slack.com/api/chat.postMessage";
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.parse(input),
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const error = await response.text();
    return { error, status: response.status };
  }

  return await response.json();
}
