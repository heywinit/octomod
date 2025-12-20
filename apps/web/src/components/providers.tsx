"use client";

import { ThemeProvider } from "./theme-provider";
import { SidebarProvider } from "./ui/sidebar";
import { Toaster } from "./ui/sonner";
import { SyncProvider } from "./sync-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <SyncProvider>
        <SidebarProvider defaultOpen={false}>{children}</SidebarProvider>
      </SyncProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
