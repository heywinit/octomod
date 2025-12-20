"use client";

import { useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Monitor, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/components/theme-provider";

export function UserMenuPopover() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate({ to: "/" });
  };

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getThemeIcon = () => {
    if (theme === "light") return Sun;
    if (theme === "dark") return Moon;
    return Monitor;
  };

  const getThemeLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  const ThemeIcon = getThemeIcon();

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.login?.slice(0, 2).toUpperCase() ||
    "U";

  const userName = user?.login || "user";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          type="button"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Avatar className="size-8 transition-opacity hover:opacity-80">
            <AvatarImage
              src={user?.avatar_url}
              alt={user?.name || user?.login || "User"}
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-64 p-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="flex h-auto cursor-pointer items-center justify-start gap-2 px-2"
          >
            <Avatar className="size-8">
              <AvatarImage
                src={user?.avatar_url}
                alt={user?.name || user?.login || "User"}
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-left font-semibold text-sm">
                {userName}
              </p>
            </div>
          </Button>

          <Separator />

          <Button
            variant="ghost"
            className="w-full cursor-pointer justify-start"
            onClick={(e) => {
              e.stopPropagation();
              cycleTheme();
            }}
          >
            <ThemeIcon className="size-4" />
            <span>Theme: {getThemeLabel()}</span>
          </Button>

          <Separator />

          <Button
            variant="ghost"
            className="w-full cursor-pointer justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
