"use client";

import { useState, useEffect } from "react";
import { Search, LogOut, Settings, User, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ResponsiveCommandDialog, ResponsiveCommandInput, ResponsiveCommandList } from "@/components/ui/responsive-command";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setAvatarPopoverOpen(false);
    navigate({ to: "/" });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.login?.slice(0, 2).toUpperCase() || "U";

  const userName = user?.login || "user";

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 md:px-6">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-2xl">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border border-input bg-background px-2 py-2 text-sm text-muted-foreground shadow-sm transition-colors",
            )}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      </div>
      <div className="flex items-center">
        <Popover open={avatarPopoverOpen} onOpenChange={setAvatarPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onMouseEnter={() => setAvatarPopoverOpen(true)}
              onMouseLeave={() => setAvatarPopoverOpen(false)}
            >
              <Avatar className="h-8 w-8 transition-opacity hover:opacity-80">
                <AvatarImage src={user?.avatar_url} alt={user?.name || user?.login || "User"} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-64 p-2"
            onMouseEnter={() => setAvatarPopoverOpen(true)}
            onMouseLeave={() => setAvatarPopoverOpen(false)}
          >
            <div className="flex flex-col gap-2">
              {/* User Header */}
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || user?.login || "User"} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col min-w-0">
                  <p className="font-semibold text-sm truncate">{userName}</p>
                </div>
              </div>

              <Separator />

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ResponsiveCommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search"
        description="Search repositories, issues, pull requests, and more..."
      >
        <ResponsiveCommandInput placeholder="Type to search..." />
        <ResponsiveCommandList>
          <div className="p-6 text-center text-sm text-muted-foreground">
            Search functionality coming soon...
          </div>
        </ResponsiveCommandList>
      </ResponsiveCommandDialog>
    </div>
  );
}

