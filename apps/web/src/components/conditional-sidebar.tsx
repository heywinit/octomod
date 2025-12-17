"use client";

import { useRouter } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";

export function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isMarketingPage = pathname?.startsWith("/home");

  if (isMarketingPage) {
    return <>{children}</>;
  }

  return <AppSidebar>{children}</AppSidebar>;
}
