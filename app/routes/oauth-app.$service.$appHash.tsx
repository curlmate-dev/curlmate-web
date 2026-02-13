import { useLoaderData } from "@remix-run/react";
import { getSession } from "~/utils/backend.cookie";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getApp, getFromRedis, getOrg } from "~/utils/backend.redis";
import { Footer } from "~/ui/curlmate/footer";
import { Header } from "~/ui/curlmate/header";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");

  const org = orgKey ? await getOrg(orgKey) : undefined;

  const { service, appHash } = params;

  if (!service || !appHash) {
    throw redirect("/404");
  }

  const app = await getApp({ appHash, service });

  if (!app) {
    throw new Error("App not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { clientSecret, ...safeApp } = app;
  const tokenId = app.tokenId;
  const token = tokenId ? await getFromRedis({ key: tokenId, service }) : null;

  return Response.json({
    org,
    app: safeApp,
    token,
    service,
    appHash,
  });
};

export default function OauthAppPage() {
  const { org, app, token, service, appHash } = useLoaderData<typeof loader>();
  return (
    <main className="min-h-screen bg-[#f5f5dc] text-[#222] font-mono">
      <Header org={org} />
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-y-8">
          <div className="bg-white border border-gray-400 rounded">
            <h2 className="underline text-lg font-bold mb-2">
              OAuth Connection:
            </h2>
            <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">
              <pre className="whitespace-pre-wrap bg-gray-100 p-2 border">
                {JSON.stringify(app, null, 2)}
              </pre>
            </div>
          </div>
          {/* Generated URLs */}
          <div className="border border-gray-400 bg-white rounded">
            <div>
              <h2 className="underline font-semibold">
                Generated Customer Auth URL:
              </h2>
              <div className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
                <a href={app.custAuthUrl} target="_blank" rel="noreferrer">
                  {app.custAuthUrl}
                </a>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white border border-gray-300 rounded p-4 mb-4">
              <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">
                <pre className="whitespace-pre-wrap bg-gray-100 p-2 border">
                  {JSON.stringify(token, null, 2)}
                </pre>
              </div>
              <a href={`/refresh-token/${service}/${appHash}`}>
                <button className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded mt-2">
                  Refresh Token
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </main>
  );
}
