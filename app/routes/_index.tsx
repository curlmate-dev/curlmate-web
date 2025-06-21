import { type MetaFunction, type LoaderFunctionArgs, json } from "@remix-run/node";
import { curlmateKeyCookie } from "../utils/backend.cookie";
import { randomBytes } from "crypto"

export const meta: MetaFunction = () => {
  return [
    { title: "curlmate" },
    { name: "description", content: "Oauth2 tokens for services" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const existingCookie = await curlmateKeyCookie.parse(cookieHeader);

  if  (existingCookie) {
    return Response.json({}, {status: 200})
  };

  const userKey = randomBytes(32).toString("base64url");
  const setCookie = await curlmateKeyCookie.serialize(userKey);

  return Response.json({}, {
    status: 200,
    headers: {
      "Set-Cookie": setCookie,
    },
  });
}

export default function Index() {
  return (
    <div className="flex flex-col items-center p-4 space-y-8 bg-[#f0e0d6] min-h-screen font-mono">
      {/* Box 1: App Description */}
      <div className="border border-gray-400 bg-white text-gray-600 p-4 w-full max-w-2xl shadow-md">
        <h1 className="underline">You have reached Curlmate[Encrypted]</h1>
        <p>An Oauth2 orchestrator and Oauth2 token vending machine.</p>
        <p>OAuth tokens stored encrypted. Decryption key lives only in your browser — via HTTP-only cookie.</p>
        <p>Use tokens to call any API securely — Curlmate exposes MCP endpoints you can run via Claude or other LLMs. Your browser becomes a vending machine for tokens.
</p>
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
        </ul>
      </div>

      {/* Footer */}
      <footer className="text-xs text-gray-600 mt-auto">
        Built with caffeine, cursing, and OAuth errors.
      </footer>
    </div>
  );
}

