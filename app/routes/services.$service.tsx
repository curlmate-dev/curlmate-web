import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { getSession, userSession } from "~/utils/backend.cookie";
import { getOrg, redis } from "~/utils/backend.redis";
import { OAuthConfig, zServiceConfig } from "~/utils/types";
import { useState } from "react";
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
  const userSelectedScope = formData.get("userSelectedScope")?.toString() ?? "";
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
    clientId,
    clientSecret,
    redirectUri,
    userSelectedScope,
    service,
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

              {!checked && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm">Client ID:</label>
                  <input
                    name="clientId"
                    defaultValue={actionData?.fields.clientId ?? ""}
                    className="border border-gray-300 rounded px-3 py-2 bg-white"
                    type="text"
                    placeholder="Paste your Client ID"
                  />
                  {actionData?.error?.clientId && (
                    <p className="text-red-600 text-sm">
                      {actionData.error.clientId}
                    </p>
                  )}
                </div>
              )}

              {!checked && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm">Client Secret:</label>
                  <input
                    name="clientSecret"
                    defaultValue={actionData?.fields.clientSecret ?? ""}
                    className="border border-gray-300 rounded px-3 py-2 bg-white"
                    type="text"
                    placeholder="Paste your Client Secret"
                  />
                  {actionData?.error?.clientSecret && (
                    <p className="text-red-600 text-sm">
                      {actionData.error.clientSecret}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm">Scopes:</label>
                <select
                  name="userSelectedScope"
                  className="border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  {Object.keys(oauthConfig.scopes).map((scope) => (
                    <option key={scope} value={oauthConfig.scopes[scope]}>
                      {scope}
                    </option>
                  ))}
                </select>
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
