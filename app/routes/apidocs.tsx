import { useEffect } from "react";

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
    <>
      <div id="swagger-ui" className="dark:bg-[#fbf2e0] min-h-screen" />
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    </>
  );
}
