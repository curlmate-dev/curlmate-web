import { CenterHeader } from "./center-header";
import { LeftHeader } from "./left-header";
import { RightHeader } from "./right-header";
import { HeaderProps } from "./ui-types";

export function Header({ org }: HeaderProps) {
  return (
    <>
      <header className="border-b border-gray-200 bg-white ">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between">
          <LeftHeader />
          <CenterHeader />
          <RightHeader org={org} />
        </div>
      </header>
    </>
  );
}
