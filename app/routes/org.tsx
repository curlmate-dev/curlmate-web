import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Footer } from "~/ui/curlmate/footer";
import { Header } from "~/ui/curlmate/header";
import { getApp, getAppsForOrg, getOrg } from "~/utils/backend.redis";
import { requireOrg } from "~/utils/backend.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const orgKey = await requireOrg(request);
  const org = await getOrg(orgKey);
  const appKeys = (await getAppsForOrg(orgKey)) ?? [];

  const appPromises = appKeys.map(async (appKey) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, appUuid, service] = appKey.split(":");
    const app = await getApp({ appUuid, service });
    return {
      [appKey]: app,
    };
  });

  const apps = await Promise.all(appPromises);
  return Response.json({ orgKey, org, apps });
};

export default function OrgPage() {
  const { orgKey, org, apps } = useLoaderData<typeof loader>();

  return (
    <div className="bg-[#f5f5dc] text-[#222] font-mono min-h-screen flex flex-col items-center">
      <main className="flex-grow space-y-8">
        <Header org={org} />
        <div className="max-w-4xl mx-auto py-8 px-4 relative">
          <div className="bg-white border border-gray-400 rounded p-6 mb-6">
            <h1 className="text-xl font-bold mb-2">Organization: {orgKey}</h1>
            <p className="text-sm text-gray-700 mb-4">
              You have {apps.length} apps configured. Manage or add more below.
            </p>
            <a
              href="/oauth-services"
              className="inline-block bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-semibold text-gray-800"
            >
              ➕ Configure New App
            </a>
          </div>
          {apps?.length === 0 && (
            <div className="bg-white border border-gray-300 rounded p-6 text-center text-gray-600">
              No OAuth apps configured yet.
            </div>
          )}
          {apps.length > 0 && (
            <div className="space-y-4">
              {apps.map((appObj, idx) => {
                const [appKey, appData] = Object.entries(appObj)[0];

                return (
                  <div
                    className="bg-white border border-gray-300 rounded p-4"
                    key={idx}
                  >
                    <h2 className="text-lg font-semibold mb-1">
                      {appData?.service}
                    </h2>

                    <p className="text-sm text-gray-700">
                      Client ID: <code>{appData?.clientId}</code>
                    </p>

                    <p className="text-sm text-gray-700">
                      Tokens: {appData?.tokens.length}
                    </p>

                    <p className="text-sm text-gray-700">
                      Last used: 2025-07-01 14:32
                    </p>

                    <p className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
                      <a
                        href={appData?.custAuthUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {appData?.custAuthUrl}
                      </a>
                    </p>

                    <a
                      href={`/oauth-app/${appData?.service}/${appKey.split(":")[1]}`}
                      className="inline-block mt-2 text-blue-700 underline text-sm"
                    >
                      View Tokens
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
