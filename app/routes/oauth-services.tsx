import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getOrg, requireOrg } from "~/utils/backend.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const orgKey = await requireOrg(request);
    const org = await getOrg(orgKey);
   
    return Response.json({ org })
}

export const action = async({}) => {
  return redirect("/logout");
}

export default function Services() {
  const { org } = useLoaderData<typeof loader>();

  return (
    <div className="bg-[#f0e0d6] min-h-screen font-mono p-4 flex flex-col items-center space-y-6">
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
        {/* Box 1: App Description */}
        <div className="border border-gray-400 bg-white text-gray-600 p-4 w-full max-w-2xl shadow-md">
          <h1 className="underline">Available Oauth Services</h1>
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