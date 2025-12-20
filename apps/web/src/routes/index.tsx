import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppDashboard } from "@/components/app-dashboard";
import { LandingPage } from "@/components/landing-page";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check auth state on mount
    checkAuth();
    setIsHydrated(true);
  }, [checkAuth]);

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show app dashboard if authenticated, landing page otherwise
  return isAuthenticated ? <AppDashboard /> : <LandingPage />;
}
