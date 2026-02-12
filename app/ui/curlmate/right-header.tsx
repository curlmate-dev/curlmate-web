import { HeaderProps } from "./ui-types";

export function RightHeader({ org }: HeaderProps) {
  return (
    <>
      {/* Right icons */}
      <div className="flex items-center gap-2 hidden lg:flex">
        {org ? (
          <div className="flex items-center gap-2">
            <img
              src={org.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-gray-400 "
            ></img>
            <a
              href="/logout"
              className="bg-gray-300 px-4 py-2 rounded inline-block text-[#222]"
            >
              Logout
            </a>
          </div>
        ) : (
          <a
            href="/login"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-200"
            aria-label="Login"
          >
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2a5 5 0 0 1 5 5c0 2.76-2.24 5-5 5s-5-2.24-5-5a5 5 0 0 1 5-5zm0 12c4.42 0 8 2.24 8 5v3H4v-3c0-2.76 3.58-5 8-5z" />
              </svg>
              <span className="font-medium">Login With Github</span>
            </span>
          </a>
        )}
      </div>
    </>
  );
}
