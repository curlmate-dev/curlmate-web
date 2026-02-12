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
    </>
  );
}
