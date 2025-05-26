import { useParams } from "@remix-run/react";

export default function OAuthPage() {
  const { service } = useParams();
  return (
    <div className="bg-[#f0e0d6] min-h-screen font-mono p-4 flex flex-col items-center space-y-6">
      {/* Header */}
      <h1 className="text-2xl underline font-bold">Setup for {service}</h1>

      {/* Redirect / Auth URLs */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-2">
        <div><strong>Redirect URL:</strong> <code>https://yourapp.com/api/callback</code></div>
        <div><strong>Auth URL:</strong> <code>https://service.com/oauth/authorize</code></div>
        <div><strong>Token URL:</strong> <code>https://service.com/oauth/token</code></div>
      </div>

      {/* Input Box */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-4">
        <div className="space-y-2">
          <label>Client ID</label>
          <input className="w-full p-1 border" type="text" placeholder="Paste your Client ID" />
        </div>

        <div className="space-y-2">
          <label>Client Secret</label>
          <input className="w-full p-1 border" type="password" placeholder="Paste your Client Secret" />
        </div>

        <div className="space-y-2">
          <label>Scopes</label>
          <select className="w-full p-1 border">
            <option value="read">read</option>
            <option value="write">write</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </div>

      {/* Generated URLs */}
      <div className="border border-gray-400 bg-white p-4 w-full max-w-2xl shadow-md space-y-4">
        <div>
          <h2 className="underline font-semibold">Generated Auth URL:</h2>
          <div className="bg-gray-100 p-2 text-xs break-all">[populated auth url here]</div>
        </div>

        <div>
          <h2 className="underline font-semibold">Token Response:</h2>
          <div className="bg-gray-100 p-2 text-xs break-all">[JSON from token POST]</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-xs text-gray-600 mt-auto">
        Real devs do it manually, but we automate.
      </footer>
    </div>
  );
}
