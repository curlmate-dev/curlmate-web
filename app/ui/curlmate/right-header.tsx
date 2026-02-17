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
        ) : null}
      </div>
    </>
  );
}
