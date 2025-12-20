"use client";

import { ChevronDown, GitPullRequest, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { usePinnedRepos } from "@/stores/pinned-repos";
import { useAuthStore } from "@/stores/auth";
import { getContextualGreeting } from "luh-calm-greet";
import { Button } from "@/components/ui/button";
import {
  useSyncEngine,
  useDashboardMetrics,
  useCIAlerts,
  useActivityFeed,
  usePinnedReposEnriched,
  type CIAlert,
} from "@/lib/sync";
import { formatTimeAgo } from "@/lib/dashboard.service";

/**
 * CI/CD Alerts Banner Component
 * Sticky, collapsible, only shows if alerts exist
 */
function CIAlertsBanner({ alerts }: { alerts: CIAlert[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const visibleAlerts = alerts.slice(0, 3);

  if (alerts.length === 0) {
    return null;
  }

  const failureCount = alerts.filter(
    (a) => a.status === "failure" || a.status === "error",
  ).length;
  const warningCount = alerts.filter((a) => a.status === "warning").length;

  return (
    <div className="sticky top-0 z-10 mb-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "rounded-lg bg-muted/50 p-3",
            failureCount > 0 && "bg-red-500/10",
            failureCount === 0 && warningCount > 0 && "bg-yellow-500/10",
          )}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle
                className={cn(
                  "size-4",
                  failureCount > 0 && "text-red-500",
                  failureCount === 0 && warningCount > 0 && "text-yellow-500",
                )}
              />
              <span className="text-sm font-medium">
                CI failing in {failureCount} repo{alerts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 flex flex-col gap-2">
              {visibleAlerts.map((alert) => (
                <a
                  key={alert.id}
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded bg-background/50 px-2 py-1.5 text-sm transition-colors hover:bg-background/80"
                >
                  <span className="font-medium">{alert.repository}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground">{alert.branch}</span>
                  <span className="text-muted-foreground">({alert.workflow})</span>
                </a>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

/**
 * Compact Issue Card Component
 * Actionable, 1-line title, repo name + status pills
 */
function IssueCard({
  issue,
}: {
  issue: {
    id: string;
    number: number;
    title: string;
    repository: string;
    state: "open" | "closed";
    url: string;
    timeAgo: string;
    labels?: string[];
    waitingOnYou?: boolean;
  };
}) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50",
        issue.waitingOnYou && "bg-yellow-500/5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            issue.state === "open" ? "bg-green-500" : "bg-muted-foreground",
          )}
        />
        <span className="truncate text-sm font-medium">{issue.title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground text-xs">{issue.repository}</span>
        {issue.waitingOnYou && (
          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-yellow-600 text-xs dark:text-yellow-500">
            Waiting on you
          </span>
        )}
        {issue.labels && issue.labels.length > 0 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
            {issue.labels[0]}
          </span>
        )}
        <span className="text-muted-foreground text-xs">{issue.timeAgo}</span>
      </div>
    </a>
  );
}

/**
 * Activity Feed Item Component
 * Visually quieter, no avatars, high context
 */
function ActivityItem({
  activity,
}: {
  activity: {
    id: string;
    title: string;
    description: string;
    updatedAt: string;
  };
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">{activity.title}</span>
        <span className="text-muted-foreground text-xs">{activity.description}</span>
      </div>
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatTimeAgo(new Date(activity.updatedAt))}
      </span>
    </div>
  );
}

/**
 * Pinned Repository Card Component
 * Shows CI status, PR/issue counts, last activity
 */
function PinnedRepositoryCard({
  repo,
}: {
  repo: {
    id: string;
    name: string;
    owner: string;
    fullName: string;
    ciStatus?: "passing" | "failing" | "pending" | "unknown";
    openIssueCount?: number;
    lastActivity?: string;
  };
}) {
  const getCIStatusColor = (status?: string) => {
    switch (status) {
      case "passing":
        return "bg-green-500";
      case "failing":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <a
      href={`https://github.com/${repo.fullName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={cn(
              "size-2 shrink-0 rounded-full",
              getCIStatusColor(repo.ciStatus),
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-sm">{repo.name}</span>
            </div>
            <span className="text-muted-foreground text-xs">{repo.owner}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        {repo.openIssueCount !== undefined && (
          <span className="flex items-center gap-1">
            <AlertCircle className="size-3" />
            {repo.openIssueCount}
          </span>
        )}
        {repo.lastActivity && (
          <span className="ml-auto">
            {formatTimeAgo(new Date(repo.lastActivity))}
          </span>
        )}
      </div>
    </a>
  );
}

/**
 * Sync Status Indicator
 */
function SyncStatusIndicator({
  syncStatus,
  lastSyncAt,
  onRefresh,
  isRefreshing,
}: {
  syncStatus: string;
  lastSyncAt?: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
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

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{getStatusText()}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing || syncStatus === "syncing"}
        className="h-7 w-7 p-0"
      >
        <RefreshCw
          className={cn("size-3.5", isRefreshing && "animate-spin")}
        />
      </Button>
    </div>
  );
}

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
            <div className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Pinned Repositories
              </h2>
              {pinnedReposEnriched.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {pinnedReposEnriched.slice(0, 5).map((repo) => (
                    <PinnedRepositoryCard key={repo.id} repo={repo} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/30 px-3 py-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    No pinned repositories
                  </p>
                </div>
              )}
            </div>

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
