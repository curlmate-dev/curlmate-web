import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { getAppsForOrg, getFromRedis, requireOrg } from "~/utils/backend.server";

export const loader = async({ request, params }: LoaderFunctionArgs) => {
    const orgKey = await requireOrg(request);

    const appKeys = await getAppsForOrg(orgKey);

    const appPromises = appKeys.map(async (appKey) => {
        const appData = await getFromRedis({key: appKey, service: appKey.split(":")[2]});
        return {
            appKey,
            appData
        }
    });

    const apps = await Promise.all(appPromises);
    return Response.json({orgKey, apps});
}

export const action = async({}) => {
    return redirect("/logout")
}

export default function OrgPage() {
    const {orgKey, apps} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    return (
        <div className="bg-[#f5f5dc] text-[#222] font-mono min-h-screen">
            <header className="absolute top-0 right-0 px-3 py-1">
                <form method="post">
                    <button className="bg-gray-300 hover:bg-gray-400 text-sm px-3 py-1 rounded" type="submit">Logout</button>
                </form>
            </header>
            <div className="max-w-4xl mx-auto py-8 px-4 relative">
                <div className="bg-white border border-gray-400 rounded p-6 mb-6">
                    <h1 className="text-xl font-bold mb-2">Organization: {orgKey}</h1>
                    <p className="text-sm text-gray-700 mb-4">You have {apps.length} apps configured. Manage or add more below.</p>
                    <a href="/oauth-services" className="inline-block bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-semibold text-gray-800">
                    ➕ Configure New App
                    </a>
                </div>
                <div className="space-y-4">
                {apps.map(({appKey, appData}) => {
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
        </div>
    );
}