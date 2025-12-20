"use client";

import { ThemeProvider } from "./theme-provider";
import { SidebarProvider } from "./ui/sidebar";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      defaultTheme="dark"
    >
      <SidebarProvider defaultOpen={false}>{children}</SidebarProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
