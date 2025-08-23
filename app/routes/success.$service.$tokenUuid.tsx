import { useActionData, useLoaderData } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { toJsonObject } from "curlconverter";
import { getFromRedis, getOrg } from "~/utils/backend.redis";
import { any } from "zod";
import { useState } from "react";
import { getSession } from "~/utils/backend.cookie";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { service, tokenUuid } = params;

  const session = await getSession(request.headers.get("Cookie") || "");
  const orgKey = session.get("orgKey");
  const org = orgKey ? await getOrg(orgKey) : undefined;

  if (!service || !tokenUuid) {
    throw redirect("/404");
  }

  const decryptedTokenResponse = await getFromRedis({
    key: `token:${tokenUuid}`,
    service,
  });

  return Response.json({
    org,
    tokenResponse: decryptedTokenResponse,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const curl = formData.get("curl")?.toString() || "";

  if (!curl) {
    return Response.json({
      curl: "",
      output: "No curl provided",
    });
  }

  try {
    const parsedCurl = toJsonObject(curl);
    const { url, method, headers, data } = parsedCurl;

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data) || undefined,
    });

    const responseBody = await response.text();
    return Response.json({ curl, output: responseBody });
  } catch (error: any) {
    return Response.json({ curl, output: `Error: ${error.message}` });
  }
};

export default function APICurlPage() {
  const { org, tokenResponse } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="bg-[#f0e0d6] min-h-screen text-gray-900 font-mono">
      <header className="border-b border-gray-200 bg-white ">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto" />
              <span className="font-medium">Curlmate</span>
            </a>
          </div>
          <div
            className="lg:hidden flex items-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 7L4 7"
                stroke="#1C274C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M20 12L4 12"
                stroke="#1C274C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M20 17L4 17"
                stroke="#1C274C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            className={`lg:hidden fixed inset-0 bg-[#fbf2e0] font-semibold flex-col items-center justify-center onClick={() => setIsOpen(false)} ${isOpen ? "flex" : "hidden"}`}
          >
            <div>
              <a href="/" className="hover:underline">
                Home
              </a>
            </div>
            <div>
              <a href="" className="hover:underline">
                Pricing
              </a>
            </div>
            <div>
              <a href="/login" className="hover:underline">
                Login With Github
              </a>
            </div>{" "}
            <button
              className="mt-8 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              {" "}
              Close{" "}
            </button>
          </div>
          {/* Right icons */}
          <div className="flex items-center gap-2 hidden lg:flex">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-200"
              aria-label="Subscribe"
            >
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="6" y1="15" x2="8" y2="15" />
                  <line x1="10" y1="15" x2="14" y2="15" />
                </svg>
                <span>Pricing</span>
              </span>
            </button>
            {org ? (
              <div className="flex items-center gap-2">
                <img
                  src={org.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-gray-400 "
                ></img>
                <a
                  href="/logout"
                  className="bg-gray-300 px-4 py-2 rounded inline-block text-[#222]"
                >
                  Logout
                </a>
              </div>
            ) : (
              <a
                href="/login"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-200"
                aria-label="Login"
              >
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a5 5 0 0 1 5 5c0 2.76-2.24 5-5 5s-5-2.24-5-5a5 5 0 0 1 5-5zm0 12c4.42 0 8 2.24 8 5v3H4v-3c0-2.76 3.58-5 8-5z" />
                  </svg>
                  <span>Login With Github</span>
                </span>
              </a>
            )}
          </div>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-400">
          <h2 className="underline text-gray-600 font-semibold">
            Token Response:
          </h2>
          <div className="bg-gray-100 p-2 text-gray-600 text-xs break-all">
            {JSON.stringify(tokenResponse, null, 2)}
          </div>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="border border-gray-400 bg-white">
          <form method="post" className="flex flex-col">
            <div className="space-y-2">
              <textarea
                name="curl"
                className="bg-gray-100 text-gray-600 h-40 w-full p-2 border font-mono resize rounded-sm"
                placeholder="Paste your Curl and edit"
                defaultValue={actionData?.curl ?? ""}
              />
            </div>
            <button
              className="bg-[#d6d6d6] h-12 rounded-lg border border-gray-600 text-sm font-bold shadow hover:bg-[#c0c0c0]"
              type="submit"
            >
              Run Curl
            </button>
          </form>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="border border-gray-400 bg-white">
          <div>
            <h2 className="underline text-gray-600 font-semibold">
              Curl Response:
            </h2>
            <div className="bg-gray-100 text-blue-600 p-2 text-xs break-all">
              <pre className="whitespace-pre-wrap bg-gray-100 p-2 border">
                {actionData?.output}
              </pre>
            </div>
          </div>
        </div>
      </section>
      <footer className="text-xs">
        <div className="max-w-7xl mx-auto h-16">
          <div className="flex flex-row justify-center gap-1">
            <div>
              <a className="underline" href="/tos.html">
                Terms Of Service
              </a>
            </div>
            <div>
              <a className="underline" href="/privacy.html">
                Privacy Policy
              </a>
            </div>
          </div>
          <div className="max-w-7xl mt-2 text-center">
            &copy; 2025 Curlmate. All rights reserved.
          </div>
          <div className="max-w-7xl mt-2 text-center">
            Contact: <a href="mailto:admin@curlmate.dev">admin@curlmate.dev</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
