import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/app-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { useSyncEngine } from "@/lib/sync";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const {
    syncStatus,
    lastSyncAt,
    isDegraded,
    isRateLimited,
    rateLimitRemaining,
    refresh,
  } = useSyncEngine();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case "syncing":
        return "Syncing...";
      case "rate-limited":
        return "Rate limited";
      case "offline":
        return "Offline";
      case "error":
        return "Sync error";
      default:
        return lastSyncAt
          ? `Updated ${formatTimeAgo(new Date(lastSyncAt))}`
          : "Ready";
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case "syncing":
        return "text-blue-500";
      case "rate-limited":
      case "error":
        return "text-red-500";
      case "offline":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6 mt-16">
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Sync Info */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
              <CardDescription>
                Information about your GitHub data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <p className={cn("text-sm", getStatusColor())}>
                    {getStatusText()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing || syncStatus === "syncing"}
                >
                  <RefreshCw
                    className={cn("size-4", isRefreshing && "animate-spin")}
                  />
                </Button>
              </div>

              {lastSyncAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Last Sync</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lastSyncAt).toLocaleString()}
                  </p>
                </div>
              )}

              {rateLimitRemaining !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Rate Limit</p>
                  <p className="text-sm text-muted-foreground">
                    {rateLimitRemaining.toLocaleString()} requests remaining
                  </p>
                </div>
              )}

              {isDegraded && (
                <div className="rounded-lg bg-yellow-500/10 p-3">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Degraded mode: Some features may be limited due to rate
                    limits
                  </p>
                </div>
              )}

              {isRateLimited && (
                <div className="rounded-lg bg-red-500/10 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Rate limited: Please wait before syncing again
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Theme Switcher */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose your preferred theme and color scheme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Select light, dark, or system theme
                  </p>
                </div>
                <ModeToggle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppDashboard>
  );
}
