export function Footer() {
  return (
    <footer className="bg-[#f5f5dc] border-t border-gray-200 text-xs py-6 mt-auto">
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
        &copy; 2026 Curlmate. All rights reserved.
      </div>
    </footer>
  );
}
