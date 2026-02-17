import { useState } from "react";
export function LeftHeader() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
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
        className={`lg:hidden fixed inset-0 bg-[#fbf2e0] font-semibold flex-col ${isOpen ? "flex" : "hidden"}`}
      >
        {/* Header at top */}
        <header className="border-b border-gray-200 bg-white px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8" />
              <span className="font-medium">Curlmate</span>
            </a>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        {/* Menu items */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <a
            href="/"
            className="text-lg hover:underline"
            onClick={() => setIsOpen(false)}
          >
            Home
          </a>
          <a
            href="/faq.html"
            className="text-lg hover:underline"
            onClick={() => setIsOpen(false)}
          >
            FAQ
          </a>
          <a
            href="/apidocs"
            className="text-lg hover:underline"
            onClick={() => setIsOpen(false)}
          >
            API Docs
          </a>
          <a
            href="/api-keys"
            className="text-lg hover:underline"
            onClick={() => setIsOpen(false)}
          >
            API Keys
          </a>
        </div>
      </div>
    </>
  );
}
