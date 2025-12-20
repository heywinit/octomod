"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import Providers from "./providers";

interface AppDashboardProps {
  children?: React.ReactNode;
}

/**
 * App Dashboard Layout - Main layout for authenticated users
 * Includes sidebar, topbar, and keyboard shortcuts
 */
export function AppDashboard({ children }: AppDashboardProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useKeyboardShortcuts();

  // Handle Shift+? to open shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Providers>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
    </Providers>
  );
}
