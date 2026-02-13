import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { configureApp, readYaml } from "~/utils/backend.server";
import { getSession, userSession } from "~/utils/backend.cookie";
import { getOrg } from "~/utils/backend.redis";
import { OAuthConfig } from "~/utils/types";
import { useState } from "react";
import { Header } from "~/ui/curlmate/header";
import { Footer } from "~/ui/curlmate/footer";

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
  const { org, oauthConfig } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [checked, setChecked] = useState(false);

  return (
    <main className="bg-[#fbf2e0] min-h-screen text-gray-900 font-sans">
      <Header org={org} />
      <h1 className="max-w-7xl mx-auto text-2xl font-medium text-center">
        {service?.toUpperCase()}
      </h1>

      {/* Redirect / Auth URLs */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col border border-gray-400 bg-white rounded-none px-2 flex flex-col pt-2 pb-2">
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
          className="border border-gray-400 bg-white rounded-none flex flex-col gap-y-8"
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
                  className="border border-gray-200 dark:border-gray-700 rounded-none bg-white h-10"
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
                  className="border border-gray-200 dark:border-gray-700 rounded-none bg-white h-10"
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
                name="userSelectedScope"
                className="border border-gray-200 dark:border-gray-700 rounded-none bg-white h-10"
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
              className="bg-sky-400 h-12 w-full rounded-none border border-gray-600 mb-1 text-sm font-bold shadow hover:bg-sky-600"
              type="submit"
            >
              Configure OAuth Connection
            </button>
          </div>
        </form>
      </section>
      {/* Footer */}
      <Footer />
    </main>
  );
}
