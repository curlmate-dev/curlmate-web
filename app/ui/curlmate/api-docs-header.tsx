import { Link } from "@remix-run/react";

export function ApiDocsHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <a href="https://app.curlmate.dev" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto" />
          <span className="font-medium">Curlmate</span>
        </a>
        <a
          href="https://app.curlmate.dev"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Go to App →
        </a>
      </div>
    </header>
  );
}
