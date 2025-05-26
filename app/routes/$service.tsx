import { useActionData, useLoaderData, useParams } from "@remix-run/react";
import {ActionFunctionArgs, json, LoaderFunctionArgs} from "@remix-run/node"
import { getAuthUrl, readYaml } from "~/utils/backend.server";

import util from "util";
import { request } from "http";
export const loader = async({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  console.log(util.inspect(url));
  const oauthConfig = await readYaml(`/oauth${url.pathname}.yaml`)
  console.log('oauthConfig:', oauthConfig)
  return json({
    oauthConfig
  })
}

export const action = async({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    console.log(util.inspect(formData))
    const authUrl = await getAuthUrl({clientId: formData.get("clientId"), redirectUri: formData.get("redirectUri"), scopes: formData.get("scopes"), authUrl: formData.get("authUrl") })
    return json({success: "true", clientId: formData.get("clientId"), clientSecret: formData.get("clientSecret"), authUrl, scope: formData.get("scopes")})
}

export default function OAuthPage() {
  const { service } = useParams();
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <div className="bg-[#f0e0d6] min-h-screen font-mono p-4 flex flex-col items-center space-y-6">
      {/* Header */}
      <h1 className="text-2xl underline font-bold">Setup for {service}</h1>

      {/* Redirect / Auth URLs */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-2">
        <div><strong>Redirect URL:</strong> <code>{data.oauthConfig.redirectUri}</code></div>
        <div><strong>Auth URL:</strong> <code>{data.oauthConfig.authUrl}</code></div>
        <div><strong>Token URL:</strong> <code>{data.oauthConfig.tokenUrl}</code></div>
      </div>

      {/* Input Box */}
      <form method="post">
        <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-4">
          <div className="space-y-2">
            <label>Client ID</label>
            <input name="clientId" defaultValue={actionData?.clientId ?? ""} className="w-full p-1 border" type="text" placeholder="Paste your Client ID" />
          </div>

          <div className="space-y-2">
            <label>Client Secret</label>
            <input name="clientSecret" defaultValue={actionData?.clientSecret ?? ""} className="w-full p-1 border" type="text" placeholder="Paste your Client Secret" />
          </div>

          <div className="space-y-2">
            <label>Scopes</label>
            <select name="scopes" className="w-full p-1 border">
              {Object.keys(data.oauthConfig.scopes).map((scope) => (<option value={data.oauthConfig.scopes[scope].value}>{scope}</option>))}
            </select>
          </div>
          <input type="hidden" name="authUrl" value={data.oauthConfig.authUrl} />
          <input type="hidden" name="redirectUri" value={data.oauthConfig.redirectUri} />
          <button className="bg-[#d6d6d6] border border-gray-600 px-4 py-1 text-sm font-mono shadow hover:bg-[#c0c0c0]" type="submit">Get Auth URL</button>
        </div>
      </form>


      {/* Generated URLs */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-4">
        <div>
          <h2 className="underline font-semibold">Generated Auth URL:</h2>
          <div className="bg-gray-100 p-2 text-xs break-all">{actionData?.authUrl}</div>
        </div>

        <div>
          <h2 className="underline font-semibold">Token Response:</h2>
          <div className="bg-gray-100 p-2 text-xs break-all">[JSON from token POST]</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-xs text-gray-600 mt-auto">
        Real devs do it manually, but we automate.
      </footer>
    </div>
  );
}
