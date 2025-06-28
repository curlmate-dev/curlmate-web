import { useActionData, useLoaderData } from "@remix-run/react";
import {ActionFunctionArgs, json, LoaderFunctionArgs, redirect} from "@remix-run/node"
import { Redis } from "@upstash/redis"
import { toJsonObject } from "curlconverter"
import { curlmateKeyCookie } from "~/utils/backend.cookie";
import { decrypt } from "~/utils/backend.encryption";

export const loader = async({ request, params }: LoaderFunctionArgs) => {
  const { service, tokenUuid } = params;

  if (!service || !tokenUuid) {
      throw redirect('/404')
  }
  const url = new URL(request.url)

  const encryptionKey = process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  })

  const token = await redis.get(`token:${tokenUuid}`);

  const decryptedTokenResponse = JSON.parse(decrypt(token, Buffer.from(encryptionKey, "base64url")));

  return Response.json({
    tokenResponse: decryptedTokenResponse,
  });
}

export const action = async({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const curl = formData.get('curl')?.toString() || ""

    if (!curl) { return Response.json({curl: "", output: "No curl provided"})}

    try {
        const parsedCurl = toJsonObject(curl)
        const { url, method, headers, data } = parsedCurl

        const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(data) || undefined
        })

        const responseBody = await response.text()
        return Response.json({curl, output: responseBody})

    } catch (error: any) {
        return Response.json({curl, output: `Error: ${error.message}`})
    }
}

export default function APICurlPage() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <div className="bg-[#f0e0d6] min-h-screen font-mono p-4 flex flex-col items-center space-y-6">
      {/* Header */}
      <div className="border border-gray-400 bg-white text-gray-600 p-4 w-full max-w-2xl shadow-md space-y-4">
        <div>
          <h2 className="underline text-gray-600 font-semibold">Token Response:</h2>
          <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">{JSON.stringify(data.tokenResponse, null, 2)}</div>
        </div>
      </div>

      {/* Input Box */}
      <form method="post">
        <div className="border border-gray-400 bg-gray-100 p-4 w-full max-w-2xl shadow-md space-y-4">
          <div className="space-y-2">
            <textarea name="curl" className="bg-gray-100 text-gray-600 h-40 w-[600px] p-2 border font-mono resize rounded-sm" placeholder="Paste your Curl and edit" defaultValue={actionData?.curl ?? ""}/>
          </div>
          <button className="bg-[#d6d6d6] border border-gray-600 text-gray-600 px-4 py-1 text-sm font-mono shadow hover:bg-[#c0c0c0]" type="submit">Run Curl</button>
        </div>
      </form>

      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-4">
        <div>
          <h2 className="underline text-gray-600 font-semibold">Curl Response:</h2>
          <div className="bg-gray-100 text-blue-600 p-2 text-xs break-all"><pre className="whitespace-pre-wrap bg-gray-100 p-2 border">{actionData?.output}</pre></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-xs text-gray-600 mt-auto">
        Seems Faster to get Oauth tokens this way and run curls
      </footer>
    </div>
  );
}
