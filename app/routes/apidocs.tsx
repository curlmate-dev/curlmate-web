import { useEffect } from "react";
import { Header } from "~/ui/curlmate/header";
import { Footer } from "~/ui/curlmate/footer";

export const links = () => [
  {
    rel: "stylesheet",
    href: "https://unpkg.com/swagger-ui-dist/swagger-ui.css",
  },
];

export default function ApiDocs() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        docExpansion: "none",
        defaultModelsExpandDepth: -1,
      });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5dc]">
      <Header />
      <div id="swagger-ui" className="flex-1 pb-8" />
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <Footer />
    </div>
  );
}
