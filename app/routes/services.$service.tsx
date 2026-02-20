import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { getSession, userSession } from "~/utils/backend.cookie";
import { getOrg, redis } from "~/utils/backend.redis";
import { OAuthConfig, zServiceConfig } from "~/utils/types";
import { useState, useEffect, useRef } from "react";
import { Header } from "~/ui/curlmate/header";
import { Footer } from "~/ui/curlmate/footer";
import { configureApp } from "~/utils/backend.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { service } = params;
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  const org = orgKey ? await getOrg(orgKey) : undefined;

  const rawConfig = await redis.get(`yaml:${service}`);
  const serviceConfig = zServiceConfig.parse(rawConfig);

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

  if (!service) {
    throw redirect("/404");
  }

  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");

  const { userId } = await userSession.parse(request.headers.get("Cookie"));
  const formData = await request.formData();
  const url = new URL(request.url);

  const origin = url.origin;

  const clientId = formData.get("clientId")?.toString();
  const clientSecret = formData.get("clientSecret")?.toString();
  const userSelectedScope = formData.getAll("userSelectedScope") as string[];
  const redirectUri = formData.get("redirectUri")?.toString();
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

  const appHash = await configureApp({
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
    redirectUri: redirectUri ?? "",
    userSelectedScope,
    service: service!,
    origin,
    orgKey,
    isCurlmate,
    userId,
  });

  return redirect(`/oauth-app/${service}/${appHash}`);
};

export default function ServicePage() {
  const { service } = useParams();
  const { oauthConfig } = useLoaderData<typeof loader>() as {
    oauthConfig: OAuthConfig;
  };
  const actionData = useActionData<typeof action>();
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [userScopes, setUserScopes] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5dc] text-[#222] font-mono">
      <Header />
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border border-gray-400 rounded p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6">
              {service?.toUpperCase()}
            </h1>

            <div className="bg-gray-100 p-3 rounded text-sm mb-4">
              <p className="mb-1">
                <strong>Redirect URL:</strong>
              </p>
              <code className="text-blue-600 break-all">
                {oauthConfig.redirectUri}
              </code>
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm mb-4">
              <p className="mb-1">
                <strong>Auth URL:</strong>
              </p>
              <code className="text-blue-600 break-all">
                {oauthConfig.authUrl}
              </code>
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p className="mb-1">
                <strong>Token URL:</strong>
              </p>
              <code className="text-blue-600 break-all">
                {oauthConfig.tokenUrl}
              </code>
            </div>
          </div>

          <div className="bg-white border border-gray-400 rounded p-6">
            <form method="post" className="flex flex-col gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isCurlmate"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                Use Curlmate Client ID
              </label>

              <div className="flex flex-col gap-1">
                {checked ? null : (
                  <>
                    <label htmlFor="cid" className="text-sm">
                      Client ID:
                    </label>
                    <input
                      name="clientId"
                      defaultValue={actionData?.fields.clientId ?? ""}
                      className="border border-gray-300 rounded px-3 py-2 bg-white"
                      type="text"
                      placeholder="Paste your Client ID"
                      id="cid"
                    />
                  </>
                )}
                {checked ? (
                  <input name="clientId" type="hidden" value="" />
                ) : null}
                {actionData?.error?.clientId && (
                  <p className="text-red-600 text-sm">
                    {actionData.error.clientId}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {checked ? null : (
                  <>
                    <label htmlFor="cs" className="text-sm">
                      Client Secret:
                    </label>
                    <input
                      name="clientSecret"
                      defaultValue={actionData?.fields.clientSecret ?? ""}
                      className="border border-gray-300 rounded px-3 py-2 bg-white"
                      type="text"
                      placeholder="Paste your Client Secret"
                      id="cs"
                    />
                  </>
                )}
                {checked ? (
                  <input name="clientSecret" type="hidden" value="" />
                ) : null}
                {actionData?.error?.clientSecret && (
                  <p className="text-red-600 text-sm">
                    {actionData.error.clientSecret}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="dd" className="text-sm">
                  Scopes:
                </label>
                <div className="relative" id="dd" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="bg-white text-black px-4 py-2 border border-gray-300 rounded w-full text-left flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <span
                      className={
                        userScopes.length ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {userScopes.length
                        ? `${userScopes.length} scope${userScopes.length > 1 ? "s" : ""} selected`
                        : "Select scopes"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {open && (
                    <div className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full shadow-lg top-full left-0 max-h-48 overflow-y-auto">
                      {userScopes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setUserScopes([])}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-b border-gray-100"
                        >
                          Clear all
                        </button>
                      )}
                      {Object.entries(oauthConfig.scopes).map(
                        ([scope, value]) => {
                          const checked = userScopes.includes(value);
                          return (
                            <label
                              key={value}
                              className="flex items-center px-3 py-2 gap-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setUserScopes((prev) =>
                                    checked
                                      ? prev.filter((v) => v !== value)
                                      : [...prev, value],
                                  )
                                }
                                className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-500"
                              />
                              <span className="text-sm">{scope}</span>
                            </label>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
                {userScopes.map((scope) => (
                  <input
                    key={scope}
                    name="userSelectedScope"
                    value={scope}
                    type="hidden"
                  ></input>
                ))}
              </div>

              <input type="hidden" name="authUrl" value={oauthConfig.authUrl} />
              <input
                type="hidden"
                name="redirectUri"
                value={oauthConfig.redirectUri}
              />
              <input
                type="hidden"
                name="tokenUrl"
                value={oauthConfig.tokenUrl}
              />
              <input type="hidden" name="service" value={service} />

              <button
                className="bg-gray-800 text-white px-4 py-3 rounded text-sm font-semibold hover:bg-gray-700 mt-4"
                type="submit"
              >
                Configure OAuth Connection
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
