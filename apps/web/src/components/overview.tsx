"use client";

import { GitPullRequest, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { usePinnedRepos } from "@/stores/pinned-repos";
import { useAuthStore } from "@/stores/auth";
import { getContextualGreeting } from "luh-calm-greet";
import {
  useSyncEngine,
  useDashboardMetrics,
  useCIAlerts,
  useActivityFeed,
  usePinnedReposEnriched,
} from "@/lib/sync";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { CIAlertsBanner } from "@/components/ci-alerts-banner";
import { IssueCard } from "@/components/issue-card";
import { ActivityItem } from "@/components/activity-item";
import { PinnedRepositories } from "@/components/pinned-repositories";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";


/**
 * Overview Component
 * 3:1 two-column layout with CI alerts, issues, activity, and pinned repos
 */
export function Overview() {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync engine
  const {
    syncStatus,
    lastSyncAt,
    refresh,
    issues,
    fetchWorkflowsForPinned,
  } = useSyncEngine();

  // Derived data from cache
  const metrics = useDashboardMetrics();
  const ciAlerts = useCIAlerts();
  const activityFeed = useActivityFeed(10);
  const pinnedReposEnriched = usePinnedReposEnriched();
  const { pinnedRepos } = usePinnedRepos();

  // Fetch workflows for pinned repos on mount
  useEffect(() => {
    if (pinnedRepos.length > 0) {
      fetchWorkflowsForPinned(
        pinnedRepos.map((r) => ({
          owner: r.owner,
          name: r.name,
          fullName: r.fullName,
        }))
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

  // Transform cached issues to display format
  const recentIssues = Object.values(issues.byId)
    .filter((issue) => issue.state === "open" && !issue.isPullRequest)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 7)
    .map((issue) => ({
      id: String(issue.id),
      number: issue.number,
      title: issue.title,
      repository: issue.repositoryFullName,
      state: issue.state,
      url: issue.htmlUrl,
      timeAgo: formatTimeAgo(new Date(issue.updatedAt)),
      labels: issue.labels.map((l) => l.name),
      waitingOnYou: issue.assignees.some((a) => a.login === user?.login),
    }));

  const isLoading = syncStatus === "syncing" && Object.keys(issues.byId).length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl mt-16">
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

        {/* CI/CD Alerts - Full Width, Sticky */}
        <CIAlertsBanner alerts={ciAlerts} />

        {/* 3:1 Two Column Layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_1.5fr]">
          {/* Main Column (Left) */}
          <div className="flex flex-col gap-4">
            {/* Recent Issues Section */}
            <div className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Recent Issues
              </h2>
              {recentIssues.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {recentIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/30 px-3 py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Nothing needs your attention
                  </p>
                </div>
              )}
            </div>

            {/* Activity Feed Section */}
            <div className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Activity Feed
              </h2>
              {activityFeed.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {activityFeed.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/20 px-3 py-6 text-center">
                  <p className="text-muted-foreground text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Context Column (Right) */}
          <div className="flex flex-col gap-4">
            {/* Open Issues and PRs Cards */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Open Issues
                    </span>
                  </div>
                  <span className="font-semibold text-2xl text-foreground">
                    {metrics.openIssues}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Open PRs
                    </span>
                  </div>
                  <span className="font-semibold text-2xl text-foreground">
                    {metrics.openPRs}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Pinned Repositories */}
            <PinnedRepositories pinnedReposEnriched={pinnedReposEnriched} />

            {/* Health Snapshot */}
            {metrics.reposNeedingAttention > 0 && (
              <div className="rounded-lg bg-yellow-500/10 px-3 py-2">
                <span className="text-yellow-600 text-sm dark:text-yellow-500">
                  {metrics.reposNeedingAttention} repo
                  {metrics.reposNeedingAttention !== 1 ? "s" : ""} need attention
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
