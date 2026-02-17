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
  const { app, token, service, appHash } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5dc] text-[#222] font-mono">
      <Header />
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-400 rounded p-6">
              <h2 className="text-lg font-bold mb-4">OAuth Connection</h2>
              <div className="bg-gray-100 p-3 rounded text-xs break-all">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(app, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-white border border-gray-400 rounded p-6">
              <h2 className="text-lg font-semibold mb-4">
                Generated Customer Auth URL
              </h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <a
                  href={app.custAuthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 break-all"
                >
                  {app.custAuthUrl}
                </a>
              </div>
            </div>

            <div className="bg-white border border-gray-400 rounded p-6">
              {token ? (
                <>
                  <div className="bg-gray-100 p-3 rounded text-xs break-all mb-4">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(token, null, 2)}
                    </pre>
                  </div>
                  <a href={`/refresh-token/${service}/${appHash}`}>
                    <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                      Refresh Token
                    </button>
                  </a>
                </>
              ) : (
                <div className="text-gray-500 mb-4">
                  No tokens found. Complete the OAuth flow to generate tokens.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
