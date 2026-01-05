import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useState } from "react";
import { userSession } from "~/utils/backend.cookie";
import { v4 as uuidv4 } from "uuid";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const { userId } = (await userSession.parse(cookieHeader)) || {};

  if (!userId) {
    return redirect("/", {
      headers: {
        "Set-Cookie": await userSession.serialize({ userId: uuidv4() }),
      },
    });
  }
  return Response.json({});
};
export default function Index() {
  const services = [
    { name: "Asana", icon: "/asana.svg", link: "/asana", alt: "asana-logo" },
    { name: "Clickup", icon: "/clickup.svg", link: "/clickup" },
    { name: "Dropbox", icon: "/dropbox.svg", link: "/dropbox" },
    { name: "Github", icon: "/github.svg", link: "/github" },
    { name: "Gmail", icon: "/gmail.svg", link: "/gmail" },
    {
      name: "Google Calendar",
      icon: "/google-calendar.svg",
      link: "/google-calendar",
    },
    { name: "Google Docs", icon: "/google-docs.svg", link: "/google-docs" },
    { name: "Google Drive", icon: "/google-drive.svg", link: "/google-drive" },
    { name: "Hubspot", icon: "/hubspot.svg", link: "/hubspot" },
    { name: "Instagram", icon: "/instagram.svg", link: "/instagram" },
    {
      name: "Jira Software Cloud",
      icon: "/jira-software-cloud.svg",
      link: "/jira-software-cloud",
    },
    { name: "Linear", icon: "/linear.svg", link: "/linear" },
    { name: "Monday", icon: "/monday.svg", link: "/monday" },
    { name: "Notion", icon: "/notion.svg", link: "/notion" },
    { name: "Salesforce", icon: "/salesforce.svg", link: "/salesforce" },
    { name: "Slack", icon: "/slack.svg", link: "/slack" },
    { name: "Pipedrive", icon: "/pipedrive.svg", link: "/pipedrive"}
  ];

  const [isOpen, setIsOpen] = useState(false);
  return (
    <main className="min-h-screen bg-[#fbf2e0] text-gray-900 font-sans">
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
            <a href="/session" className="underline">
              view tokens
            </a>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="mt-1">
          <a
            href="/how-it-works.html"
            className="text-blue-600 dark:text-blue-400"
          >
            How it works test
          </a>
        </p>
      </section>

      {/* Quick access cards */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold mb-4">OAuth2 Services:</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <a
              key={s.name}
              href={s.link}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white hover:shadow dark:hover:shadow hover:bg-gray-100 dark:hover:bg-gray-200  transition"
            >
              <div className="text-3xl mb-2">
                <img src={s.icon} className="h-6" alt={s.alt}></img>
              </div>
              <div className="text-sm text-center">{s.name}</div>
            </a>
          ))}
        </div>
      </section>
      <footer className="border-gray-200 text-xs py-6">
        <div className="flex flex-wrap justify-center max-w-7xl mx-auto space-x-6">
          <a
            href="/tos.html"
            className="font-semibold hover:underline text-gray-600"
          >
            Terms Of Service
          </a>
          <a
            href="/privacy.html"
            className="font-semibold hover:underline text-gray-600"
          >
            Privacy Policy
          </a>
        </div>
        <div className="flex flex-wrap justify-center">
          {"  "}
          Contact:{" "}
          <a
            href="mailto:admin@curlmate.dev"
            className="font-semibold hover:underline text-gray-600"
          >
            admin@curlmate.dev
          </a>
        </div>
        <div className="flex flex-wrap justify-center max-w-7xl mx-auto mt-4 font-normal text-gray-500">
          &copy; 2025 Curlmate. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
