import { useActionData, useLoaderData } from "@remix-run/react";
import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node"
import { toJsonObject } from "curlconverter"
import { getFromRedis } from "~/utils/backend.redis";

export const loader = async({ request, params }: LoaderFunctionArgs) => {
  const { service, tokenUuid } = params;

  if (!service || !tokenUuid) {
      throw redirect('/404')
  }

  const decryptedTokenResponse = await getFromRedis({key:`token:${tokenUuid}`, service})

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
      <main className="flex-grow space-y-8">
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
