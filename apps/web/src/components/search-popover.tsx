"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SearchPopover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search or jump to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className={cn("w-full pr-20 pl-9")}
            />
            <kbd className="pointer-events-none absolute top-1/2 right-3 z-10 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="mt-1 w-full max-w-2xl p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            width: containerRef.current?.offsetWidth,
          }}
        >
          <div className="p-2">
            {searchQuery.trim() ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Search functionality coming soon...
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Start typing to search...
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
