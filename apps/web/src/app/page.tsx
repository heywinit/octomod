"use client";

import { Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { API_ROUTES, COOKIE_NAMES, STORAGE_KEYS } from "@/lib/constants";
import {
  fetchRepositories,
  getGitHubToken,
  type Repository,
} from "@/lib/github.service";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadRepositories = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const repos = await fetchRepositories(token, 5);
      setRepositories(repos);
      setError(null);
    } catch (err) {
      console.error("Error fetching repositories:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load repositories. Please try again.";
      setError(errorMessage);
      if (errorMessage.includes("Session expired")) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for OAuth callback token in cookie
    const tokenCookiePrefix = `${COOKIE_NAMES.GITHUB_TOKEN_TEMP}=`;
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(tokenCookiePrefix));

    if (tokenCookie) {
      const token = tokenCookie.split("=")[1];
      localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
      // Clear the cookie
      const expires = new Date(0).toUTCString();
      document.cookie = `${COOKIE_NAMES.GITHUB_TOKEN_TEMP}=; expires=${expires}; path=/;`;
      router.refresh();
    }

    // Check if user is authenticated
    const token = getGitHubToken();
    if (token) {
      setIsAuthenticated(true);
      loadRepositories(token);
    } else {
      setIsLoading(false);
    }

    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
      // Clean up URL
      window.history.replaceState({}, "", "/");
    }
  }, [router, loadRepositories]);

  const handleLogin = () => {
    window.location.href = API_ROUTES.AUTH.GITHUB.LOGIN;
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
    setIsAuthenticated(false);
    setRepositories([]);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Card key={`skeleton-${i + 1}`}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Github className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Octomod</CardTitle>
            <CardDescription>
              A customizable GitHub dashboard for developers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            )}
            <Button onClick={handleLogin} className="w-full" size="lg">
              <Github className="mr-2 h-4 w-4" />
              Login with GitHub
            </Button>
            <p className="text-center text-muted-foreground text-sm">
              Connect your GitHub account to get started
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Your Repositories</h1>
            <p className="text-muted-foreground">
              Your top 5 most recently updated repositories
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {repositories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No repositories found. Create a repository on GitHub to see it
                here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repositories.map((repo) => (
              <Card key={repo.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {repo.name}
                    </a>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {repo.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full bg-primary" />
                        {repo.language}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
