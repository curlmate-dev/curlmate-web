import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { userSession } from "~/utils/backend.cookie";
import { v4 as uuidv4 } from "uuid";
import { Header } from "~/ui/curlmate/header";
import { Footer } from "~/ui/curlmate/footer";

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
    {
      name: "Airtable",
      icon: "/airtable.svg",
      link: "/airtable",
      alt: "airtable-logo",
    },
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
    // { name: "Pipedrive", icon: "/pipedrive.svg", link: "/pipedrive" },
  ];

  return (
    <main className="min-h-screen bg-[#fbf2e0] text-gray-900 font-sans">
      <Header />
      {/* Welcome */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="mt-1">
          <a
            href="/how-it-works.html"
            className="text-blue-600 dark:text-blue-400"
          >
            How it works
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
      <Footer />
    </main>
  );
}
