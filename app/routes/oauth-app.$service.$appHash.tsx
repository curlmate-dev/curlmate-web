import { useLoaderData } from "@remix-run/react";
import { userSession, flowSession } from "~/utils/backend.cookie";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getApp, getFromRedis, userOwnsApp } from "~/utils/backend.redis";
import { Footer } from "~/ui/curlmate/footer";
import { Header } from "~/ui/curlmate/header";
import { isApiHost } from "~/utils/get-host";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (isApiHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  const cookieHeader = request.headers.get("Cookie");
  const { userId } = (await userSession.parse(cookieHeader)) || {};
  const flow = await flowSession.parse(cookieHeader);

  if (!userId || !flow || flow.flowStep !== "started") {
    return redirect("/");
  }

  const { service, appHash } = params;

  if (!service || !appHash) {
    throw redirect("/404");
  }

  const ownsApp = await userOwnsApp({ userId, appHash, service });
  if (!ownsApp) {
    return redirect("/");
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
                  <div className="mb-4">
                    <h3 className="text-md font-semibold mb-2">Token Status</h3>
                    <p className="text-green-600 font-medium">Connected</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-md font-semibold mb-2">Scopes</h3>
                    <p className="text-sm text-gray-600">
                      {app.userSelectedScope.join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <a href={`/oauth-token/${service}/${appHash}`}>
                      <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                        View Token
                      </button>
                    </a>
                    <a href={`/refresh-token/${service}/${appHash}`}>
                      <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                        Refresh Token
                      </button>
                    </a>
                  </div>
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
