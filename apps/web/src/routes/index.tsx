import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppDashboard } from "@/components/app-dashboard";
import { LandingPage } from "@/components/landing-page";
import { useAuthStore } from "@/stores/auth";
import { COOKIE_NAMES } from "@/lib/constants";
import { getCookie, deleteCookie } from "@/lib/utils";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
  const { isAuthenticated, checkAuth, setToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check for auth callback - extract token from cookie
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("auth") === "success") {
        // Get token from temporary cookie
        const token = await getCookie(COOKIE_NAMES.GITHUB_TOKEN_TEMP);
        if (token) {
          // Store token in Zustand store (which also syncs to localStorage)
          setToken(token);
          // Clear the temporary cookie
          await deleteCookie(COOKIE_NAMES.GITHUB_TOKEN_TEMP);
          // Clean up URL
          window.history.replaceState({}, "", "/");
        }
      }
    };

    // Check auth state on mount
    checkAuth();
    handleAuthCallback();
    setIsHydrated(true);
  }, [checkAuth, setToken]);

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
