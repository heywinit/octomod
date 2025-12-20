import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppDashboard } from "@/components/app-dashboard";
import { LandingPage } from "@/components/landing-page";
import { Overview } from "@/components/overview";
import { COOKIE_NAMES } from "@/lib/constants";
import { deleteCookie, getCookie } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { fetchUser } from "@/lib/github.service";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated, checkAuth, setToken, setUser, token, user } =
    useAuthStore();
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

          // Fetch user info after setting token
          try {
            const userData = await fetchUser(token);
            setUser(userData);
          } catch (error) {
            console.error("Failed to fetch user info:", error);
          }
        } else {
          checkAuth();
        }
      } else {
        checkAuth();
      }

      setIsHydrated(true);
    };

    handleAuthCallback();
  }, [checkAuth, setToken, setUser]);

  // Fetch user info if we have a token but no user data
  useEffect(() => {
    const loadUserIfNeeded = async () => {
      if (token && !user && isHydrated) {
        try {
          const userData = await fetchUser(token);
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user info:", error);
        }
      }
    };

    loadUserIfNeeded();
  }, [token, user, isHydrated, setUser]);

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
      <Overview />
    </AppDashboard>
  );
}
