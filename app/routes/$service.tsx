import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node"
import { configureApp, readYaml } from "~/utils/backend.server";
import { getSession } from "~/utils/backend.cookie";
import { getOrg } from "~/utils/backend.redis";

export const loader = async({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  const org = orgKey ? await getOrg(orgKey) : undefined;

  const url = new URL(request.url);

  const oauthConfig = await readYaml(`/oauth${url.pathname}.yaml`);

  if (url.pathname === "/slack" && process.env.NODE_ENV === "development") {
    oauthConfig.redirectUri = process.env.SLACK_OAUTH_CALLBACK_URL
  } else {
    oauthConfig.redirectUri = process.env.OAUTH_CALLBACK_URL
  }

  return Response.json({
    org,
    oauthConfig,
  });
}

export const action = async({ request }: ActionFunctionArgs) => {
    const session = await getSession(request.headers.get("Cookie") || "");
    const orgKey = session.get("orgKey");

    const formData = await request.formData()
    const url = new URL(request.url);

    const service = formData.get("service");
    const origin = url.origin;
  
    const appUuid = await configureApp({
      clientId: formData.get("clientId"),
      clientSecret: formData.get("clientSecret"), 
      redirectUri: formData.get("redirectUri"), 
      scopes: formData.get("scopes"), 
      authUrl: formData.get("authUrl"),
      tokenUrl: formData.get("tokenUrl"),
      service,
      origin,
      orgKey 
    });
    
    return redirect(`/oauth-app/${service}/${appUuid}`);
}

export default function OAuthPage() {
  const { service } = useParams();
  const {org , oauthConfig } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <div className="bg-[#f0e0d6] min-h-screen font-mono p-4 flex flex-col items-center space-y-6 min-w-[800px]">
      {/* Header */}
      <header className="absolute top-0 right-0 px-3 py-1">
        {org ? (
          <div className="flex items-center gap-2">
            <img 
              src={org.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-gray-400 "
            ></img>
            <a href="/logout" className="bg-gray-300 px-4 py-2 rounded inline-block text-[#222]">Logout</a>
          </div>
        ) : (<a href="/login" className="bg-gray-300 px-4 py-2 rounded inline-block text-[#222]">Login with GitHub</a>)}
      </header>
      <h1 className="text-2xl underline font-bold text-gray-600">{service}</h1>

      {/* Redirect / Auth URLs */}
      <main className="flex-grow space-y-8">
        <div className="border border-gray-400 bg-white text-gray-600 p-4 w-full max-w-2xl shadow-md space-y-2">
          <div><strong>Redirect URL:</strong> <code>{oauthConfig.redirectUri}</code></div>
          <div><strong>Auth URL:</strong> <code>{oauthConfig.authUrl}</code></div>
          <div><strong>Token URL:</strong> <code>{oauthConfig.tokenUrl}</code></div>
        </div>

        {/* Input Box */}
        <form method="post">
          <div className="border border-gray-400 bg-white text-gray-600 p-4 w-full max-w-2xl shadow-md space-y-4">
            <div className="space-y-2">
              <label>Client ID</label>
              <input name="clientId" defaultValue={actionData?.clientId ?? ""} className="w-full p-1 border bg-white" type="text" placeholder="Paste your Client ID" />
            </div>

            <div className="space-y-2">
              <label>Client Secret</label>
              <input name="clientSecret" defaultValue={actionData?.clientSecret ?? ""} className="w-full p-1 border bg-white" type="text" placeholder="Paste your Client Secret" />
            </div>

            <div className="space-y-2">
              <label>Scopes</label>
              <select name="scopes" className="w-full p-1 border bg-white">
                {Object.keys(oauthConfig.scopes).map((scope) => (<option key={scope} value={oauthConfig.scopes[scope]}>{scope}</option>))}
              </select>
            </div>
            <input type="hidden" name="authUrl" value={oauthConfig.authUrl} />
            <input type="hidden" name="redirectUri" value={oauthConfig.redirectUri} />
            <input type="hidden" name="tokenUrl" value={oauthConfig.tokenUrl} />
            <input type="hidden" name="service" value={service} />
            <button className="bg-[#d6d6d6] border border-gray-600 px-4 py-1 text-sm font-mono shadow hover:bg-[#c0c0c0]" type="submit">Configure OAuth APP</button>
          </div>
        </form>
      </main>
      {/* Footer */}
      <footer className="text-xs text-gray-600 mt-auto">
        <div className="flex items-center space-x-4">
          <div>
            <a className="underline" href="/tos.html">Terms Of Service</a>
          </div>
          <div>
            <a className="underline" href="/privacy.html">Privacy Policy</a>
          </div>
        </div>
        <div className="mt-2 text-center">
          &copy; 2025 Curlmate. All rights reserved.
        </div>
        <div className="mt-2 text-center">
          Contact: <a href="mailto:admin@curlmate.dev">admin@curlmate.dev</a>
        </div>
      </footer>
    </div>
  );
}
