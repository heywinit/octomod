"use client";

import { AlertCircle, GitPullRequest } from "lucide-react";
import { getContextualGreeting } from "luh-calm-greet";
import { useEffect, useState } from "react";
import { ActivityItem } from "@/components/activity-item";
import { CIAlertsBanner } from "@/components/ci-alerts-banner";
import { NotificationItem } from "@/components/notification-item";
import { PinnedRepositories } from "@/components/pinned-repositories";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { Card, CardContent } from "@/components/ui/card";
import {
  useActivityFeed,
  useCIAlerts,
  useDashboardMetrics,
  useIssuesNeedingAttention,
  useNotifications,
  usePinnedReposEnriched,
  usePRsNeedingReview,
  useSyncEngine,
} from "@/lib/sync";
import { useAuthStore } from "@/stores/auth";
import { usePinnedRepos } from "@/stores/pinned-repos";

/**
 * Overview Component
 * 3:1 two-column layout with CI alerts, issues, activity, and pinned repos
 */
export function Overview() {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync engine
  const { syncStatus, lastSyncAt, refresh, issues, fetchWorkflowsForPinned } =
    useSyncEngine();

  // Derived data from cache
  const metrics = useDashboardMetrics();
  const activityFeed = useActivityFeed(10);
  const pinnedReposEnriched = usePinnedReposEnriched();
  const { pinnedRepos } = usePinnedRepos();
  const notifications = useNotifications(8);
  const issuesNeedingAttention = useIssuesNeedingAttention(user?.login || "");
  const prsNeedingReview = usePRsNeedingReview(user?.login || "");
  const ciAlerts = useCIAlerts();

  // Fetch workflows for pinned repos on mount
  useEffect(() => {
    if (pinnedRepos.length > 0) {
      fetchWorkflowsForPinned(
        pinnedRepos.map((r) => ({
          owner: r.owner,
          name: r.name,
          fullName: r.fullName,
        })),
      );
    }
  }, [pinnedRepos, fetchWorkflowsForPinned]);

  useEffect(() => {
    if (user) {
      setGreeting(
        getContextualGreeting({
          name: user.name || user.login,
        }),
      );
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading =
    syncStatus === "syncing" && Object.keys(issues.byId).length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mx-auto mt-16 w-full max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-semibold text-4xl tracking-tight">
            {greeting || "Overview"}
          </h1>
          <SyncStatusIndicator
            syncStatus={syncStatus}
            lastSyncAt={lastSyncAt}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* CI Alerts Banner */}
        <CIAlertsBanner alerts={ciAlerts} />

        {/* 3:1 Two Column Layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[3fr_1.5fr]">
          {/* Main Column (Left) */}
          <div className="flex flex-col gap-6">
            {/* Activity Feed Section */}
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-foreground/80 text-sm uppercase tracking-wide">
                Activity
              </h2>
              {activityFeed.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {activityFeed.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 bg-card px-3 py-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    No recent activity
                  </p>
                </div>
              )}
            </div>

            {/* Issues Needing Attention Section */}
            {issuesNeedingAttention.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-medium text-foreground/80 text-sm uppercase tracking-wide">
                  Needs Attention
                </h2>
                <div className="flex flex-col gap-2">
                  {issuesNeedingAttention.slice(0, 5).map((issue) => (
                    <a
                      key={issue.id}
                      href={issue.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-accent"
                    >
                      <AlertCircle className="size-4 shrink-0 text-orange-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {issue.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {issue.repositoryFullName} #{issue.number}
                        </p>
                      </div>
                      {issue.labels[0] && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                          {issue.labels[0].name}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* PRs Needing Review Section */}
            {prsNeedingReview.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-medium text-foreground/80 text-sm uppercase tracking-wide">
                  Review Requested
                </h2>
                <div className="flex flex-col gap-2">
                  {prsNeedingReview.slice(0, 5).map((pr) => (
                    <a
                      key={pr.id}
                      href={pr.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-accent"
                    >
                      <GitPullRequest className="size-4 shrink-0 text-blue-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {pr.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {pr.repositoryFullName} #{pr.number}
                        </p>
                      </div>
                      {pr.draft && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                          Draft
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Context Column (Right) */}
          <div className="flex flex-col gap-4">
            {/* Open Issues and PRs Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-green-500" />
                    <span className="font-medium text-foreground/70 text-xs uppercase tracking-wide">
                      Open Issues
                    </span>
                  </div>
                  <span className="font-semibold text-3xl text-foreground">
                    {metrics.openIssues}
                  </span>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="size-4 text-blue-500" />
                    <span className="font-medium text-foreground/70 text-xs uppercase tracking-wide">
                      Open PRs
                    </span>
                  </div>
                  <span className="font-semibold text-3xl text-foreground">
                    {metrics.openPRs}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Pinned Repositories */}
            <PinnedRepositories pinnedReposEnriched={pinnedReposEnriched} />

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-foreground/80 text-xs uppercase tracking-wide">
                  Notifications
                </h3>
                <div className="flex flex-col gap-1.5">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
