"use client";

import { SearchPopover } from "@/components/search-popover";
import { FeedbackPopover } from "@/components/feedback-popover";
import { UserMenuPopover } from "@/components/user-menu-popover";

export function AppTopbar() {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
      <div className="flex flex-1 items-center justify-center">
        <SearchPopover />
      </div>
      <div className="flex items-center gap-2">
        <FeedbackPopover />
        <UserMenuPopover />
      </div>
    </div>
  );
}

