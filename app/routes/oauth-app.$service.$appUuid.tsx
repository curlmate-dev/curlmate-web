import { useLoaderData } from "@remix-run/react"
import { curlmateKeyCookie } from "~/utils/backend.cookie";
import { Redis } from "@upstash/redis";
import { decrypt } from "~/utils/backend.encryption";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async({ params }: LoaderFunctionArgs) => {
    const {service, appUuid } = params;

    if (!service || !appUuid) {
        throw redirect('/404')
    }
    const encryptionKey = process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    const app = await redis.get(`app:${appUuid}:${service}`);
    const decryptedApp = JSON.parse(decrypt(app, Buffer.from(encryptionKey, "base64url")));

    const tokenIds = decryptedApp.tokens;
    const tokenPromises = tokenIds.map(async (tokenId) => {
        const tokenRaw = await redis.get(tokenId);
        return JSON.parse(decrypt(tokenRaw, Buffer.from(encryptionKey, "base64url")));
    });

    const tokens = await Promise.all(tokenPromises);

    return Response.json({
        app: decryptedApp,
        tokens,
    })
}

export default function OauthAppPage() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <div className="bg-[#f5f5dc] text-[#222] font-mono min-h-screen">
            <div className="max-w-3xl mx-auto py-10">
                <div className="bg-white border border-gray-400 rounded p-4 mb-6">
                    <h2 className="underline text-lg font-bold mb-2">OAuth App:</h2>
                    <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">{JSON.stringify(loaderData.app, null, 2)}</div>
                </div>
                {/* Generated URLs */}
                <div className="border border-gray-400 bg-white text-gray-600 rounded p-4 mb-6">
                    <div>
                        <h2 className="underline font-semibold">Generated Customer Auth URL:</h2>
                        <div className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
                            <a href={loaderData.app.custAuthUrl} target="_blank">{loaderData.app.custAuthUrl}</a>
                        </div>
                    </div>
                </div>
                <div>
                    {loaderData.tokens.map(token => (
                        <div className="bg-white border border-gray-300 rounded p-4 mb-4">
                            <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">{JSON.stringify(token, null, 2)}</div>
                            <form method="post" action={`/refresh-token/${token.uuid}`}>
                                <button className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded mt-2">Refresh Token</button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}