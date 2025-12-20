"use client";

import { ArrowDown, GitBranch, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type DashboardData,
  fetchDashboardData,
  type Issue,
  type Metric,
  type PendingItem,
  type PinnedRepository,
  type RecentActivity,
} from "@/lib/dashboard.service";
import { cn } from "@/lib/utils";
import { usePinnedRepos } from "@/stores/pinned-repos";

/**
 * Metric Card Component
 */
function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card className="flex flex-col gap-2">
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm">{metric.label}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-2xl">{metric.value}</span>
          <span
            className={cn(
              "text-sm",
              metric.change.isPositive
                ? "text-muted-foreground"
                : "text-muted-foreground",
            )}
          >
            {metric.change.isPositive ? "+" : ""}
            {metric.change.value}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Notification Banner Component
 */
function NotificationBanner({
  notification,
  onCheck,
  onDismiss,
}: {
  notification: { count: number; message: string; source: string };
  onCheck?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <p className="text-sm">
        You have <strong>{notification.count}</strong> {notification.message}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onCheck}>
          Check
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/**
 * Pending Item Component
 */
function PendingItemCard({ item }: { item: PendingItem }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-1 items-center gap-3">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-muted" />
        </Avatar>
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-medium text-sm">{item.title}</p>
          <p className="text-muted-foreground text-sm">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {item.actionLabel && (
          <Button size="sm" variant="outline">
            {item.actionLabel}
          </Button>
        )}
        <span className="text-muted-foreground text-sm">{item.timeAgo}</span>
      </div>
    </div>
  );
}

/**
 * Issue Card Component
 */
function IssueCard({ issue }: { issue: Issue }) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex flex-1 items-center gap-3">
        <div
          className={cn(
            "size-2 shrink-0 rounded-full",
            issue.state === "open" ? "bg-green-500" : "bg-muted-foreground",
          )}
        />
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-medium text-sm">{issue.title}</p>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{issue.repository}</span>
            <span>#{issue.number}</span>
            {issue.labels && issue.labels.length > 0 && (
              <div className="flex gap-1">
                {issue.labels.slice(0, 3).map((label) => (
                  <span
                    key={label}
                    className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="text-muted-foreground text-sm">{issue.timeAgo}</span>
    </a>
  );
}

/**
 * Pinned Repository Card Component
 */
function PinnedRepositoryCard({ repo }: { repo: PinnedRepository }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{repo.name}</span>
          </div>
          <span className="text-muted-foreground text-xs">{repo.owner}</span>
        </div>
      </div>
      {repo.description && (
        <p className="line-clamp-2 text-muted-foreground text-sm">
          {repo.description}
        </p>
      )}
      <div className="flex items-center gap-4 text-muted-foreground text-xs">
        {repo.language && (
          <span className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-blue-500" />
            {repo.language}
          </span>
        )}
        {repo.stargazersCount !== undefined && (
          <span className="flex items-center gap-1">
            <Star className="size-3" />
            {repo.stargazersCount}
          </span>
        )}
      </div>
    </a>
  );
}

/**
 * Recent Activity Item Component
 */
function RecentActivityItem({ activity }: { activity: RecentActivity }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-1 items-center gap-3">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-muted" />
        </Avatar>
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-medium text-sm">{activity.title}</p>
          <p className="text-muted-foreground text-sm">
            {activity.description}
          </p>
        </div>
      </div>
      <span className="text-muted-foreground text-sm">{activity.timeAgo}</span>
    </div>
  );
}

/**
 * Overview Component
 * Main dashboard overview page with metrics, notifications, and activity
 */
export function Overview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pinnedRepos } = usePinnedRepos();

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await fetchDashboardData();
        // Merge pinned repos from store into dashboard data
        const pinnedReposData: PinnedRepository[] = pinnedRepos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          owner: repo.owner,
          fullName: repo.fullName,
          description: repo.description,
          language: repo.language,
          stargazersCount: repo.stargazersCount,
          updatedAt: repo.updatedAt,
          url: `https://github.com/${repo.fullName}`,
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

  const handleCheckNotifications = () => {
    // TODO: Navigate to notifications page or open notifications
    console.log("Check notifications");
  };

  const handleDismissNotifications = () => {
    // TODO: Dismiss notifications
    console.log("Dismiss notifications");
  };

  return (
    <div className="flex flex-1 flex-col items-center p-4 md:p-6">
      <div className="mt-16 flex w-full max-w-4xl flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">Overview</h1>
        </div>

        {/* Notification Banner */}
        {data.notification && (
          <NotificationBanner
            notification={data.notification}
            onCheck={handleCheckNotifications}
            onDismiss={handleDismissNotifications}
          />
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Pending Items Section */}
        {data.pendingItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">
              Pending{" "}
              <strong className="font-normal text-muted-foreground">
                {data.pendingItems.length}
              </strong>
            </h2>
            <div className="flex flex-col gap-3">
              {data.pendingItems.map((item) => (
                <PendingItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout for Issues and Pinned Repos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Issues Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">
              Issues{" "}
              {data.issues.length > 0 && (
                <strong className="font-normal text-muted-foreground">
                  {data.issues.length}
                </strong>
              )}
            </h2>
            {data.issues.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.issues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground text-sm">No open issues</p>
              </div>
            )}
          </div>

          {/* Pinned Repositories Section */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">
              Pinned Repositories{" "}
              {data.pinnedRepositories.length > 0 && (
                <strong className="font-normal text-muted-foreground">
                  {data.pinnedRepositories.length}
                </strong>
              )}
            </h2>
            {data.pinnedRepositories.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {data.pinnedRepositories.map((repo) => (
                  <PinnedRepositoryCard key={repo.id} repo={repo} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No pinned repositories
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
          {data.recentActivity.length > 0 ? (
            <>
              <div className="flex flex-col gap-3">
                {data.recentActivity.map((activity) => (
                  <RecentActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              {data.recentActivity.length > 4 && (
                <Button variant="ghost" className="w-fit gap-2">
                  <ArrowDown className="size-4" />
                  Show {data.recentActivity.length - 4} more
                </Button>
              )}
            </>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No recent activity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
