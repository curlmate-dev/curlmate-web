import { useLoaderData } from "@remix-run/react"
import { curlmateKeyCookie, getSession } from "~/utils/backend.cookie";
import { Redis } from "@upstash/redis";
import { decrypt } from "~/utils/backend.encryption";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getOrg } from "~/utils/backend.server";

export const loader = async({ request, params }: LoaderFunctionArgs) => {
    const session = await getSession(request.headers.get("Cookie") || "");
    const orgKey = session.get("orgKey");

    const org = orgKey ? await getOrg(orgKey) : undefined;

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
        org,
        app: decryptedApp,
        tokens,
    })
}

export default function OauthAppPage() {
    const {org, app, tokens} = useLoaderData<typeof loader>();

    return (
        <div className="bg-[#f5f5dc] text-[#222] font-mono min-h-screen flex flex-col items-center">
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
            <main className="flex-grow space-y-8">
                <div className="max-w-3xl mx-auto py-10">
                    <div className="bg-white border border-gray-400 rounded p-4 mb-6">
                        <h2 className="underline text-lg font-bold mb-2">OAuth App:</h2>
                        <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">{JSON.stringify(app, null, 2)}</div>
                    </div>
                    {/* Generated URLs */}
                    <div className="border border-gray-400 bg-white text-gray-600 rounded p-4 mb-6">
                        <div>
                            <h2 className="underline font-semibold">Generated Customer Auth URL:</h2>
                            <div className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
                                <a href={app.custAuthUrl} target="_blank">{app.custAuthUrl}</a>
                            </div>
                        </div>
                    </div>
                    <div>
                        {tokens.map(token => (
                            <div className="bg-white border border-gray-300 rounded p-4 mb-4">
                                <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">{JSON.stringify(token, null, 2)}</div>
                                <form method="post" action={`/refresh-token/${token.uuid}`}>
                                    <button className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded mt-2">Refresh Token</button>
                                </form>
                            </div>
                        ))}
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
    )
}