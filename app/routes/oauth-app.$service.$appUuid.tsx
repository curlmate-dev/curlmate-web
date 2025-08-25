import { useLoaderData } from "@remix-run/react";
import { getSession } from "~/utils/backend.cookie";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getApp, getFromRedis, getOrg } from "~/utils/backend.redis";
import { useState } from "react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");

  const org = orgKey ? await getOrg(orgKey) : undefined;

  const { service, appUuid } = params;

  if (!service || !appUuid) {
    throw redirect("/404");
  }

  const app = await getApp({ appUuid, service });

  if (!app) {
    throw new Error("App not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { clientSecret, ...safeApp } = app;
  const tokenIds = app.tokens;
  const tokenPromises = tokenIds.map(async (tokenId) => {
    const token = await getFromRedis({ key: tokenId, service });
    return { [tokenId]: token };
  });

  const tokens = await Promise.all(tokenPromises);

  return Response.json({
    org,
    app: safeApp,
    tokens,
    service,
    appUuid,
  });
};

export default function OauthAppPage() {
  const { org, app, tokens, service, appUuid } = useLoaderData<typeof loader>();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <main className="min-h-screen bg-[#f5f5dc] text-[#222] font-mono">
      <header className="border-b border-gray-200 bg-white ">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto" />
              <span className="font-medium">Curlmate</span>
            </a>
          </div>
          <div
            className="lg:hidden flex items-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 7L4 7"
                stroke="#1C274C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M20 12L4 12"
                stroke="#1C274C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M20 17L4 17"
                stroke="#1C274C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            className={`lg:hidden fixed inset-0 bg-[#fbf2e0] font-semibold flex-col items-center justify-center onClick={() => setIsOpen(false)} ${isOpen ? "flex" : "hidden"}`}
          >
            <div>
              <a href="/" className="hover:underline">
                Home
              </a>
            </div>
            <div>
              <a href="" className="hover:underline">
                Pricing
              </a>
            </div>
            <div>
              <a href="/login" className="hover:underline">
                Login With Github
              </a>
            </div>{" "}
            <button
              className="mt-8 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              {" "}
              Close{" "}
            </button>
          </div>
          {/* Right icons */}
          <div className="flex items-center gap-2 hidden lg:flex">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-200"
              aria-label="Subscribe"
            >
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="6" y1="15" x2="8" y2="15" />
                  <line x1="10" y1="15" x2="14" y2="15" />
                </svg>
                <span>Pricing</span>
              </span>
            </button>
            {org ? (
              <div className="flex items-center gap-2">
                <img
                  src={org.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-gray-400 "
                ></img>
                <a
                  href="/logout"
                  className="bg-gray-300 px-4 py-2 rounded inline-block text-[#222]"
                >
                  Logout
                </a>
              </div>
            ) : (
              <a
                href="/login"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-200"
                aria-label="Login"
              >
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a5 5 0 0 1 5 5c0 2.76-2.24 5-5 5s-5-2.24-5-5a5 5 0 0 1 5-5zm0 12c4.42 0 8 2.24 8 5v3H4v-3c0-2.76 3.58-5 8-5z" />
                  </svg>
                  <span>Login With Github</span>
                </span>
              </a>
            )}
          </div>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-y-8">
          <div className="bg-white border border-gray-400 rounded">
            <h2 className="underline text-lg font-bold mb-2">OAuth App:</h2>
            <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">
              {JSON.stringify(app, null, 2)}
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
            {tokens.map((tokenObj, idx) => {
              const [tokenId, token] = Object.entries(tokenObj)[0];
              return (
                <div
                  key={tokenId}
                  className="bg-white border border-gray-300 rounded p-4 mb-4"
                >
                  <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">
                    {JSON.stringify(token, null, 2)}
                  </div>
                  <form
                    method="post"
                    action={`/refresh-token/${service}/${appUuid}/${tokenId}`}
                  >
                    <button className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded mt-2">
                      Refresh Token
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="text-xs">
        <div className="max-w-7xl mx-auto h-16">
          <div className="flex flex-row justify-center gap-1">
            <div>
              <a className="underline" href="/tos.html">
                Terms Of Service
              </a>
            </div>
            <div>
              <a className="underline" href="/privacy.html">
                Privacy Policy
              </a>
            </div>
          </div>
          <div className="max-w-7xl mt-2 text-center">
            &copy; 2025 Curlmate. All rights reserved.
          </div>
          <div className="max-w-7xl mt-2 text-center">
            Contact: <a href="mailto:admin@curlmate.dev">admin@curlmate.dev</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
