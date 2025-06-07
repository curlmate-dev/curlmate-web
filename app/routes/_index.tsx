import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "curlmate" },
    { name: "description", content: "Oauth2 tokens for services" },
  ];
};

export default function Index() {
  return (
    <div className="flex flex-col items-center p-4 space-y-8 bg-[#f0e0d6] min-h-screen font-mono">
      {/* Box 1: App Description */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md">
        <h1 className="text-xl font-bold underline mb-2">Welcome to TokenSpitter</h1>
        <p>A retro tool for developers to spit out OAuth tokens fast. No more doc diving.</p>
      </div>

      {/* Box 2: Service Links */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md">
        <h2 className="text-lg font-semibold underline mb-2">Choose your Service</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><a href="/google" className="text-blue-600 underline">Google</a></li>
          <li><a href="/salesforce" className="text-blue-600 underline">Salesforce</a></li>
          <li><a href="/dropbox" className="text-blue-600 underline">Dropbox</a></li>
          <li><a href="/jira-software-cloud" className="text-blue-600 underline">Jira</a></li>
          <li><a href="/hubspot" className="text-blue-600 underline">Hubspot</a></li>
          <li><a href="/asana" className="text-blue-600 underline">Asana</a></li>
          <li><a href="/github" className="text-blue-600 underline">Github</a></li>
          <li><a href="/clickup" className="text-blue-600 underline">Clickup</a></li>
          <li><a href="/monday" className="text-blue-600 underline">Monday</a></li>
          <li><a href="/linear" className="text-blue-600 underline">Linear</a></li>
        </ul>
      </div>

      {/* Footer */}
      <footer className="text-xs text-gray-600 mt-auto">
        Built with caffeine, cursing, and OAuth errors.
      </footer>
    </div>
  );
}

