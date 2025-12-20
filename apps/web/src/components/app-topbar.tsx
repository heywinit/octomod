"use client";

import { SearchPopover } from "@/components/search-popover";
import { UserMenuPopover } from "@/components/user-menu-popover";

export function AppTopbar() {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 md:px-6">
      <div className="flex flex-1 items-center justify-center">
        <SearchPopover />
      </div>
      <div className="flex items-center">
        <UserMenuPopover />
      </div>
    </div>
  );
}

