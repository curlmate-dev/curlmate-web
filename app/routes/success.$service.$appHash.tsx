import { useActionData, useLoaderData } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { toJsonObject } from "curlconverter";
import { getFromRedis, getOrg } from "~/utils/backend.redis";
import { getSession } from "~/utils/backend.cookie";
import { Footer } from "~/ui/curlmate/footer";
import { Header } from "~/ui/curlmate/header";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { service, appHash } = params;

  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  const org = orgKey ? await getOrg(orgKey) : undefined;

  if (!service || !appHash) {
    throw redirect("/404");
  }

  const decryptedTokenResponse = await getFromRedis({
    key: `token:${appHash}`,
    service,
  });

  return Response.json({
    org,
    tokenResponse: decryptedTokenResponse,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const curl = formData.get("curl")?.toString() || "";

  if (!curl) {
    return Response.json({
      curl: "",
      output: "No curl provided",
    });
  }

  try {
    const parsedCurl = toJsonObject(curl);
    const { url, method, headers, data } = parsedCurl;

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data) || undefined,
    });

    const responseBody = await response.text();
    return Response.json({ curl, output: responseBody });
  } catch (error: any) {
    return Response.json({ curl, output: `Error: ${error.message}` });
  }
};

export default function APICurlPage() {
  const { org, tokenResponse } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="bg-[#f0e0d6] min-h-screen text-gray-900 font-mono">
      <Header org={org} />
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-400">
          <h2 className="underline text-gray-600 font-semibold">
            Token Response:
          </h2>
          <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">
            <pre className="whitespace-pre-wrap bg-gray-100 p-2 border">
              {JSON.stringify(tokenResponse, null, 2)}
            </pre>
          </div>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="border border-gray-400 bg-white">
          <form method="post" className="flex flex-col">
            <div className="space-y-2">
              <textarea
                name="curl"
                className="bg-gray-100 text-gray-600 h-40 w-full p-2 border font-mono resize rounded-sm"
                placeholder="Paste your Curl and edit"
                defaultValue={actionData?.curl ?? ""}
              />
            </div>
            <button
              className="bg-[#d6d6d6] h-12 rounded-lg border border-gray-600 text-sm font-bold shadow hover:bg-[#c0c0c0]"
              type="submit"
            >
              Run Curl
            </button>
          </form>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="border border-gray-400 bg-white">
          <div>
            <h2 className="underline text-gray-600 font-semibold">
              Curl Response:
            </h2>
            <div className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
              <pre className="whitespace-pre-wrap bg-gray-100 p-2 border">
                {actionData?.output}
              </pre>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
