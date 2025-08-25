import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { configureApp, readYaml } from "~/utils/backend.server";
import { getSession } from "~/utils/backend.cookie";
import { getOrg } from "~/utils/backend.redis";
import { OAuthConfig } from "~/utils/types";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  const org = orgKey ? await getOrg(orgKey) : undefined;

  const url = new URL(request.url);

  const serviceConfig = readYaml(`/oauth${url.pathname}.yaml`);

  const oauthConfig: OAuthConfig = {
    authUrl: serviceConfig.authUrl,
    tokenUrl: serviceConfig.tokenUrl,
    redirectUri: process.env.OAUTH_CALLBACK_URL!,
    scopes: serviceConfig.scopes,
  };

  return Response.json({
    org,
    oauthConfig,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { service } = params;

  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");

  const formData = await request.formData();
  const url = new URL(request.url);

  const origin = url.origin;

  const clientId = formData.get("clientId")?.toString();
  const clientSecret = formData.get("clientSecret")?.toString();
  const scopes = formData.get("scopes")?.toString() ?? "";
  const redirectUri = formData.get("redirectUri")?.toString();
  const authUrl = formData.get("authUrl")?.toString();
  const tokenUrl = formData.get("tokenUrl")?.toString();
  const isCurlmate = formData.get("isCurlmate") === "on";

  const fields = {
    clientId,
    clientSecret,
  };

  if (!clientId && !isCurlmate) {
    return Response.json({
      error: { clientId: "Missing Client Id" },
      fields,
    });
  }

  if (!clientSecret && !isCurlmate) {
    return Response.json({
      error: { clientSecret: "Missing Client Secret" },
      fields,
    });
  }

  const appUuid = await configureApp({
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    authUrl,
    tokenUrl,
    service,
    origin,
    orgKey,
    isCurlmate,
  });

  return redirect(`/oauth-app/${service}/${appUuid}`);
};

export default function OAuthPage() {
  const { service } = useParams();
  const { org, oauthConfig } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <main className="bg-[#fbf2e0] min-h-screen text-gray-900 font-sans">
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

      <h1 className="max-w-7xl mx-auto text-2xl font-medium text-center">
        {service?.toUpperCase()}
      </h1>

      {/* Redirect / Auth URLs */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col border border-gray-400 bg-white rounded-lg px-2 flex flex-col pt-2 pb-2">
          <div className="font-medium text-sm wrap break-word">
            <strong>Redirect URL:</strong>{" "}
            <code>{oauthConfig.redirectUri}</code>
          </div>
          <div className="font-medium text-sm wrap break-word">
            <strong>Auth URL:</strong>
            {"  "}
            <code>{oauthConfig.authUrl}</code>
          </div>
          <div className="font-medium text-sm wrap break-word">
            <strong>Token URL:</strong>
            {"  "}
            <code>{oauthConfig.tokenUrl}</code>
          </div>
        </div>
      </section>
      {/* Input Box */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <form
          method="post"
          className="border border-gray-400 bg-white rounded-lg flex flex-col gap-y-8"
        >
          <label className="px-1 py-1">
            <input
              type="checkbox"
              name="isCurlmate"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            Use Curlmate Client ID
          </label>
          {!checked && (
            <div className={`flex flex-col gap-y-2 px-1`}>
              <label className="flex flex-col gap-y-1">
                Client ID:
                <input
                  name="clientId"
                  defaultValue={actionData?.fields.clientId ?? ""}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white h-10"
                  type="text"
                  placeholder="Paste your Client ID"
                />
              </label>
              <div className="text-red-600">{actionData?.error?.clientId}</div>
            </div>
          )}
          {!checked && (
            <div className="flex flex-col gap-y-2 px-1">
              <label className="flex flex-col gap-y-1">
                Client Secret:
                <input
                  name="clientSecret"
                  defaultValue={actionData?.fields.clientSecret ?? ""}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white h-10"
                  type="text"
                  placeholder="Paste your Client Secret"
                />
              </label>
              <div className="text-red-600">
                {actionData?.error?.clientSecret}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-y-2 px-1">
            <label className="flex flex-col gap-y-1">
              Scopes:
              <select
                name="scopes"
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white h-10"
              >
                {Object.keys(oauthConfig.scopes).map((scope) => (
                  <option key={scope} value={oauthConfig.scopes[scope]}>
                    {scope}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <input type="hidden" name="authUrl" value={oauthConfig.authUrl} />
            <input
              type="hidden"
              name="redirectUri"
              value={oauthConfig.redirectUri}
            />
            <input type="hidden" name="tokenUrl" value={oauthConfig.tokenUrl} />
            <input type="hidden" name="service" value={service} />
          </div>
          <div className="px-1">
            <button
              className="bg-[#d6d6d6] h-12 w-full rounded-lg border border-gray-600 text-sm font-bold shadow hover:bg-[#c0c0c0]"
              type="submit"
            >
              Configure OAuth APP
            </button>
          </div>

        </form>
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
