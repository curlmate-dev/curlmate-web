import { useEffect } from "react";
import { Footer } from "~/ui/curlmate/footer";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { isApiHost } from "~/utils/get-host";
import { ApiDocsHeader } from "~/ui/curlmate/api-docs-header";

export const links = () => [
  {
    rel: "stylesheet",
    href: "https://unpkg.com/swagger-ui-dist/swagger-ui.css",
  },
];
export async function loader({ request }: LoaderFunctionArgs) {
  if (!isApiHost(request) && process.env.NODE_ENV === "production") {
    return redirect("https://api.curlmate.dev/apidocs", 301);
  }
  return null;
}

export default function ApiDocs() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js";
    script.onload = () => {
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          presets: [window.SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
          docExpansion: "none",
          defaultModelsExpandDepth: -1,
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5dc]">
      <ApiDocsHeader />
      <div id="swagger-ui" className="flex-1 pb-8" />
      <Footer />
    </div>
  );
}
