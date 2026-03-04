import { CenterHeader } from "./center-header";
import { LeftHeader } from "./left-header";

export function Header() {
  return (
    <>
      <header className="border-b border-gray-200 bg-white ">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between">
          <LeftHeader />
          <CenterHeader />
        </div>
      </header>
    </>
  );
}
