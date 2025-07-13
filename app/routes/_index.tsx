import {  LoaderFunctionArgs, ActionFunctionArgs, redirect, MetaFunction } from "@remix-run/node";
import {  getSession } from "../utils/backend.cookie";
import { useLoaderData } from "@remix-run/react";
import { getOrg } from "~/utils/backend.redis";

export const meta: MetaFunction = () => {
  return [
    { title: "curlmate" },
    { name: "description", content: "Oauth2 tokens for services" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  if (orgKey) {
    const org = await getOrg(orgKey);
    return Response.json({ org });
  }

  return Response.json({})
}

export default function Index() {
  const { org } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-center p-4 space-y-8 bg-[#f0e0d6] min-h-screen font-mono">
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
        {/* Box 1: App Description */}
      <main className="flex-grow space-y-8">
        <div className="border border-gray-400 bg-white text-gray-600 p-4 w-full max-w-2xl shadow-md">
          <h1 className="underline">You have reached Curlmate[Encrypted]</h1>
          <p>An Oauth2 orchestrator and Oauth2 token bank</p>
          <p>OAuth tokens stored encrypted</p>
          <p>Use your oauth token to run API requests with Curlmate as a proxy server <a className="underline text-blue-600" href="/how-it-works.html">how it works</a></p>
        </div>

        {/* Box 2: Service Links */}
        <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md">
          <h2 className="text-lg font-semibold underline mb-2 text-blue-600">Choose your Service</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="/google-calendar" className="text-blue-600 underline">Google Calendar</a></li>
            <li><a href="/google-drive" className="text-blue-600 underline">Google Drive</a></li>
            <li><a href="/salesforce" className="text-blue-600 underline">Salesforce</a></li>
            <li><a href="/dropbox" className="text-blue-600 underline">Dropbox</a></li>
            <li><a href="/jira-software-cloud" className="text-blue-600 underline">Jira</a></li>
            <li><a href="/hubspot" className="text-blue-600 underline">Hubspot</a></li>
            <li><a href="/asana" className="text-blue-600 underline">Asana</a></li>
            <li><a href="/github" className="text-blue-600 underline">Github</a></li>
            <li><a href="/clickup" className="text-blue-600 underline">Clickup</a></li>
            <li><a href="/monday" className="text-blue-600 underline">Monday</a></li>
            <li><a href="/linear" className="text-blue-600 underline">Linear</a></li>
            <li><a href="/google-docs" className="text-blue-600 underline">Google Docs</a></li>
            <li><a href="/notion" className="text-blue-600 underline">Notion</a></li>
            <li><a href="/slack" className="text-blue-600 underline">Slack</a></li>
            <li><a href="/instagram" className="text-blue-600 underline">Instagram</a></li>
          </ul>
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

