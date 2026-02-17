import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { userSession } from "~/utils/backend.cookie";
import { v4 as uuidv4 } from "uuid";
import { Header } from "~/ui/curlmate/header";
import { Footer } from "~/ui/curlmate/footer";
import { readYaml } from "~/utils/backend.server";
import fs from "fs";
import path from "path";
import { useState } from "react";

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

  const oauthDir = path.join(process.cwd(), "app/oauth");
  const files = fs.readdirSync(oauthDir).filter((f) => f.endsWith(".yaml"));

  const services = files
    .map((file) => {
      try {
        const config = readYaml(`/oauth/${file}`);
        if (!config.isProd) return null;
        const name = config.name;
        return {
          name,
          icon: `/${name}.svg`,
          link: `/${name}`,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return Response.json({ services });
};

export default function Index() {
  const { services } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");

  const filteredServices = query
    ? services.filter((s: { name: string }) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf2e0] text-gray-900 font-sans">
      <Header />
      <main className="flex-1">
        <section className="max-w-2xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-center mb-8">
            Connect Your Accounts
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg bg-white"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded-md">
              Search
            </button>
          </div>
          {query && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg">
              {filteredServices.length > 0 ? (
                filteredServices.map(
                  (s: { name: string; icon: string; link: string }) => (
                    <a
                      key={s.name}
                      href={s.link}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <img src={s.icon} alt={s.name} className="w-6 h-6" />
                      <span className="font-medium">{s.name}</span>
                    </a>
                  ),
                )
              ) : (
                <div className="p-4 text-gray-500 text-center">
                  No services found
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
