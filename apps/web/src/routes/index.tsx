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
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get("auth");

      if (authParam === "success") {
        // Clean up URL immediately to prevent redirect loops
        window.history.replaceState({}, "", "/");

        // Try to get token from cookie (synchronous check first)
        let token: string | null = null;
        const cookieName = encodeURIComponent(COOKIE_NAMES.GITHUB_TOKEN_TEMP);
        const cookies = document.cookie.split("; ");

        for (const cookie of cookies) {
          if (cookie.startsWith(`${cookieName}=`)) {
            token = decodeURIComponent(cookie.substring(cookieName.length + 1));
            break;
          }
        }

        // If not found synchronously, try async method with a small delay
        if (!token) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          token = await getCookie(COOKIE_NAMES.GITHUB_TOKEN_TEMP);
        }

        if (token) {
          setToken(token);
          await deleteCookie(COOKIE_NAMES.GITHUB_TOKEN_TEMP);
        } else {
          checkAuth();
        }
      } else {
        checkAuth();
      }

      setIsHydrated(true);
    };

    handleAuthCallback();
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
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
          <p className="text-muted-foreground">
            Welcome to your Octomod dashboard. Start building your GitHub dashboard here.
          </p>
        </div>
      </div>
    </AppDashboard>
  );
}
