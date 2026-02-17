export function CenterHeader() {
  return (
    <>
      <div className="flex items-center gap-6 hidden lg:flex">
        <a
          href="/faq.html"
          className="font-medium hover:underline text-gray-600"
        >
          FAQ
        </a>
        <a
          href="/apidocs"
          className="font-medium hover:underline text-gray-600"
        >
          API Docs
        </a>
        <a
          href="/api-keys"
          className="font-medium hover:underline text-gray-600"
        >
          API Keys
        </a>
      </div>
    </>
  );
}
