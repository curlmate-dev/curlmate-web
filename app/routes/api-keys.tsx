import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { userSession } from "~/utils/backend.cookie";
import { createApiKey, deleteApiKey, listApiKeys } from "~/utils/backend.api";
import { Header } from "~/ui/curlmate/header";
import { Footer } from "~/ui/curlmate/footer";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const { userId } = await userSession.parse(cookieHeader) || {};

  if (!userId) {
    return redirect("/");
  }

  const apiKeys = await listApiKeys(userId);

  return Response.json({ userId, apiKeys });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const { userId } = await userSession.parse(cookieHeader) || {};

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const { plainKey } = await createApiKey(name, userId);
    return Response.json({ success: true, plainKey });
  }

  if (intent === "delete") {
    const keyHash = formData.get("keyHash") as string;
    if (!keyHash) {
      return Response.json({ error: "Key hash required" }, { status: 400 });
    }

    await deleteApiKey(keyHash, userId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid intent" }, { status: 400 });
};

export default function ApiKeysPage() {
  const { userId, apiKeys } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="min-h-screen bg-[#f5f5dc] text-[#222] font-mono">
      <Header />
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-400 rounded p-6 mb-6">
          <h1 className="text-xl font-bold mb-4">API Keys</h1>
          <p className="text-sm text-gray-600 mb-4">
            Create API keys to authenticate with the Curlmate API.
          </p>

          <Form method="post" className="mb-6">
            <input type="hidden" name="intent" value="create" />
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                placeholder="Key name (e.g., 'My API Client')"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                required
              />
              <button
                type="submit"
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              >
                Create API Key
              </button>
            </div>
          </Form>

          {actionData && "plainKey" in actionData && actionData.plainKey && (
            <div className="bg-green-100 border border-green-400 rounded p-4 mb-4">
              <p className="font-bold text-green-800 text-sm">API Key Created!</p>
              <p className="text-xs text-gray-600 mt-1">Copy it now - you won't see it again:</p>
              <code className="block bg-white border border-green-300 p-2 mt-2 text-xs break-all">
                {actionData.plainKey}
              </code>
            </div>
          )}
        </div>

        {apiKeys.length > 0 && (
          <div className="bg-white border border-gray-400 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Your API Keys</h2>
            <div className="space-y-3">
              {apiKeys.map((key: { keyHash: string; name: string; createdAt: number; status: string }) => (
                <div key={key.keyHash} className="flex items-center justify-between border border-gray-200 rounded p-3">
                  <div>
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">Status: {key.status}</p>
                  </div>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="keyHash" value={key.keyHash} />
                    <button
                      type="submit"
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </Form>
                </div>
              ))}
            </div>
          </div>
        )}

        {apiKeys.length === 0 && (
          <div className="bg-white border border-gray-300 rounded p-6 text-center text-gray-500">
            No API keys yet. Create one above.
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
