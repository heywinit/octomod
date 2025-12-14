"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

export function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMarketingPage = pathname?.startsWith("/home");

  if (isMarketingPage) {
    return <>{children}</>;
  }

  return <AppSidebar>{children}</AppSidebar>;
}

