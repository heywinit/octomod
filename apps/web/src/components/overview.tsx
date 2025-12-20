"use client";

import { ChevronDown, GitPullRequest, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type DashboardData,
  fetchDashboardData,
  type Issue,
  type PinnedRepository,
  type RecentActivity,
  type CIAlert,
  type HealthSnapshot,
} from "@/lib/dashboard.service";
import { cn } from "@/lib/utils";
import { usePinnedRepos } from "@/stores/pinned-repos";
import { useAuthStore } from "@/stores/auth";
import { getContextualGreeting } from "luh-calm-greet";

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
function IssueCard({ issue }: { issue: Issue }) {
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
function ActivityItem({ activity }: { activity: RecentActivity }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">{activity.title}</span>
        <span className="text-muted-foreground text-xs">{activity.description}</span>
      </div>
      <span className="shrink-0 text-muted-foreground text-xs">
        {activity.timeAgo}
      </span>
    </div>
  );
}

/**
 * Pinned Repository Card Component
 * Shows CI status, PR/issue counts, last activity
 */
function PinnedRepositoryCard({ repo }: { repo: PinnedRepository }) {
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
      href={repo.url}
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
        {repo.openPrCount !== undefined && (
          <span className="flex items-center gap-1">
            <GitPullRequest className="size-3" />
            {repo.openPrCount}
          </span>
        )}
        {repo.openIssueCount !== undefined && (
          <span className="flex items-center gap-1">
            <AlertCircle className="size-3" />
            {repo.openIssueCount}
          </span>
        )}
        {repo.lastActivity && (
          <span className="ml-auto">{repo.lastActivity}</span>
        )}
      </div>
    </a>
  );
}

/**
 * Quick Health Snapshot Component
 */
function HealthSnapshot({ snapshot }: { snapshot?: HealthSnapshot }) {
  if (!snapshot) {
    return null;
  }

  if (snapshot.allSystemsGreen) {
    return (
      <div className="rounded-lg bg-green-500/10 px-3 py-2">
        <span className="text-green-600 text-sm dark:text-green-500">
          All systems green
        </span>
      </div>
    );
  }

  if (snapshot.reposNeedingAttention && snapshot.reposNeedingAttention > 0) {
    return (
      <div className="rounded-lg bg-yellow-500/10 px-3 py-2">
        <span className="text-yellow-600 text-sm dark:text-yellow-500">
          {snapshot.reposNeedingAttention} repo
          {snapshot.reposNeedingAttention !== 1 ? "s" : ""} need attention
        </span>
      </div>
    );
  }

  if (snapshot.staleRepos && snapshot.staleRepos > 0) {
    return (
      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <span className="text-muted-foreground text-sm">
          {snapshot.staleRepos} repo{snapshot.staleRepos !== 1 ? "s" : ""} hasn't been
          touched in {snapshot.staleDays || 14} days
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Overview Component
 * 3:1 two-column layout with CI alerts, issues, activity, and pinned repos
 */
export function Overview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pinnedRepos } = usePinnedRepos();
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (user) {
      setGreeting(
        getContextualGreeting({
          name: user.name || user.login,
        }),
      );
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await fetchDashboardData();
        // Merge pinned repos from store into dashboard data
        const pinnedReposData: PinnedRepository[] = pinnedRepos
          .slice(0, 5)
          .map((repo) => ({
            id: repo.id,
            name: repo.name,
            owner: repo.owner,
            fullName: repo.fullName,
            description: repo.description,
            language: repo.language,
            stargazersCount: repo.stargazersCount,
            updatedAt: repo.updatedAt,
            url: `https://github.com/${repo.fullName}`,
            ciStatus: "unknown" as const,
            openPrCount: 0,
            openIssueCount: 0,
            lastActivity: "recently",
          }));
        setData({
          ...dashboardData,
          pinnedRepositories: pinnedReposData,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pinnedRepos]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const recentIssues = data.issues.slice(0, 7);
  const recentActivity = data.recentActivity;

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl mt-16">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-semibold text-2xl tracking-tight">
            {greeting || "Overview"}
          </h1>
        </div>

        {/* CI/CD Alerts - Full Width, Sticky */}
        <CIAlertsBanner alerts={data.ciAlerts || []} />

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
              {recentActivity.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {recentActivity.map((activity) => (
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
            {/* Pinned Repositories */}
            <div className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Pinned Repositories
              </h2>
              {data.pinnedRepositories.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {data.pinnedRepositories.map((repo) => (
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

            {/* Quick Health Snapshot */}
            {data.healthSnapshot && (
              <HealthSnapshot snapshot={data.healthSnapshot} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
