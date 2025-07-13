import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { getApp, getAppsForOrg, getFromRedis, getOrg } from "~/utils/backend.redis";
import { requireOrg } from "~/utils/backend.server";

export const loader = async({ request, params }: LoaderFunctionArgs) => {
    const orgKey = await requireOrg(request);
    const org = await getOrg(orgKey);
    const appKeys = await getAppsForOrg(orgKey) ?? [];

    const appPromises = appKeys.map(async (appKey) => {
        const [_, appUuid, service] = appKey.split(":")
        const app = await getApp({appUuid, service})
        return {
            [appKey]: app,
        }
    });

    const apps = await Promise.all(appPromises);
    return Response.json({orgKey, org, apps});
}

export default function OrgPage() {
    const {orgKey, org, apps} = useLoaderData<typeof loader>();

    return (
        <div className="bg-[#f5f5dc] text-[#222] font-mono min-h-screen flex flex-col items-center">
            <header className="absolute top-0 right-0 px-3 py-1">
                {
                <div className="flex items-center gap-2">
                    <img 
                    src={org.avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-gray-400 "
                    ></img>
                    <a href="/logout" className="bg-gray-300 px-4 py-2 rounded inline-block text-[#222]">Logout</a>
                </div>
                }
            </header>
            <main className="flex-grow space-y-8">
                <div className="max-w-4xl mx-auto py-8 px-4 relative">
                    <div className="bg-white border border-gray-400 rounded p-6 mb-6">
                        <h1 className="text-xl font-bold mb-2">Organization: {orgKey}</h1>
                        <p className="text-sm text-gray-700 mb-4">You have {apps.length} apps configured. Manage or add more below.</p>
                        <a href="/oauth-services" className="inline-block bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-semibold text-gray-800">
                        ➕ Configure New App
                        </a>
                    </div>
                    <div className="space-y-4">
                    {apps.map((appObj, idx) => {
                        const [appKey, appData] = Object.entries(appObj)[0];
                        return (
                            <div className="bg-white border border-gray-300 rounded p-4">
                                <h2 className="text-lg font-semibold mb-1">{appData.service}</h2>
                                <p className="text-sm text-gray-700">Client ID: <code>{appData.clientId}</code></p>
                                <p className="text-sm text-gray-700">Tokens: {appData.tokens.length}</p>
                                <p className="text-sm text-gray-700">Last used: 2025-07-01 14:32</p>
                                <p className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
                                    <a href={appData.custAuthUrl} target="_blank">{appData.custAuthUrl}</a>
                                </p>
                                <a href={`/oauth-app/${appData.service}/${appKey.split(":")[1]}`} className="inline-block mt-2 text-blue-700 underline text-sm">View Tokens</a>
                            </div>
                        )
                    })}
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