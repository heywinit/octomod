/**
 * Dashboard Service
 * Provides data structures and types for the dashboard overview
 */

import { getOctokitFromStorage } from "./octokit";
import { STORAGE_KEYS } from "./constants";

export interface Metric {
  id: string;
  label: string;
  value: string;
  change: {
    value: number;
    isPositive: boolean;
  };
}

export interface Notification {
  id: string;
  count: number;
  message: string;
  source: string;
}

export interface PendingItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  actionLabel?: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  repository: string;
  state: "open" | "closed";
  timeAgo: string;
  url: string;
  labels?: string[];
  waitingOnYou?: boolean;
}

export interface PinnedRepository {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  description?: string;
  language?: string;
  stargazersCount?: number;
  updatedAt?: string;
  url: string;
  ciStatus?: "passing" | "failing" | "pending" | "unknown";
  openPrCount?: number;
  openIssueCount?: number;
  lastActivity?: string;
}

export interface CIAlert {
  id: string;
  repository: string;
  branch: string;
  workflow: string;
  status: "failure" | "error" | "warning";
  url: string;
}

export interface HealthSnapshot {
  reposNeedingAttention?: number;
  allSystemsGreen?: boolean;
  staleRepos?: number;
  staleDays?: number;
}

export interface DashboardData {
  metrics: Metric[];
  notification: Notification | null;
  pendingItems: PendingItem[];
  recentActivity: RecentActivity[];
  issues: Issue[];
  pinnedRepositories: PinnedRepository[];
  ciAlerts: CIAlert[];
  healthSnapshot?: HealthSnapshot;
}

/**
 * Fetches dashboard data from GitHub API
 * @returns Dashboard data including metrics, notifications, pending items, and recent activity
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  // Get token from localStorage
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN)
      : null;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const octokit = getOctokitFromStorage();
  if (!octokit) {
    throw new Error("Failed to initialize Octokit client");
  }

  try {
    // Fetch data in parallel
    const [
      userResponse,
      reposResponse,
      issuesResponse,
      pullRequestsResponse,
      notificationsResponse,
    ] = await Promise.allSettled([
      octokit.rest.users.getAuthenticated(),
      octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        per_page: 100,
        type: "all",
      }),
      octokit.rest.issues.listForAuthenticatedUser({
        filter: "all",
        state: "open",
        sort: "updated",
        direction: "desc",
        per_page: 30,
      }),
      octokit.rest.search.issuesAndPullRequests({
        q: "is:pr is:open author:@me",
        sort: "updated",
        order: "desc",
        per_page: 30,
      }),
      octokit.rest.activity.listNotificationsForAuthenticatedUser({
        all: false,
        per_page: 10,
      }),
    ]);

    const user =
      userResponse.status === "fulfilled" ? userResponse.value.data : null;
    const repos =
      reposResponse.status === "fulfilled" ? reposResponse.value.data : [];
    const issues =
      issuesResponse.status === "fulfilled" ? issuesResponse.value.data : [];
    const pullRequests =
      pullRequestsResponse.status === "fulfilled"
        ? pullRequestsResponse.value.data.items || []
        : [];
    const notifications =
      notificationsResponse.status === "fulfilled"
        ? notificationsResponse.value.data
        : [];

    // Transform issues
    const transformedIssues: Issue[] = issues
      .filter((issue: any) => !issue.pull_request) // Exclude PRs
      .slice(0, 20)
      .map((issue: any) => {
        const repoName = issue.repository?.full_name || issue.repository_url.split("/").slice(-2).join("/");
        return {
          id: issue.id.toString(),
          number: issue.number,
          title: issue.title,
          repository: repoName,
          state: issue.state as "open" | "closed",
          timeAgo: formatTimeAgo(new Date(issue.updated_at)),
          url: issue.html_url,
          labels: issue.labels
            .filter((label: any) => typeof label === "object" && "name" in label)
            .map((label: any) => (label as { name: string }).name),
          waitingOnYou: issue.assignee?.login === user?.login,
        };
      });

    // Transform recent activity from notifications
    const recentActivity: RecentActivity[] = notifications.slice(0, 10).map(
      (notification: any) => ({
        id: notification.id,
        title: notification.subject.title || "Notification",
        description: `${notification.repository?.full_name || "Unknown"} - ${notification.subject.type}`,
        timeAgo: formatTimeAgo(new Date(notification.updated_at)),
      }),
    );

    // Calculate metrics
    const activeRepos = repos.filter(
      (repo: any) =>
        new Date(repo.updated_at).getTime() >
        Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).length;

    const openPrsCount = pullRequests.length;
    const openIssuesCount = issues.filter((i: any) => !i.pull_request).length;

    // Format metrics
    const metrics: Metric[] = [
      {
        id: "active-repos",
        label: "Active Repositories",
        value: formatMetricValue(activeRepos),
        change: {
          value: 0,
          isPositive: true,
        },
      },
      {
        id: "open-prs",
        label: "Open Pull Requests",
        value: formatMetricValue(openPrsCount),
        change: {
          value: 0,
          isPositive: false,
        },
      },
      {
        id: "open-issues",
        label: "Open Issues",
        value: formatMetricValue(openIssuesCount),
        change: {
          value: 0,
          isPositive: false,
        },
      },
      {
        id: "contributions",
        label: "Contributions",
        value: user ? formatMetricValue(user.public_repos) : "0",
        change: {
          value: 0,
          isPositive: true,
        },
      },
    ];

    // Notification
    const notification: Notification | null =
      notifications.length > 0
        ? {
            id: "notifications",
            count: notifications.length,
            message: `You have ${notifications.length} unread notification${notifications.length !== 1 ? "s" : ""}`,
            source: "GitHub",
          }
        : null;

    return {
      metrics,
      notification,
      pendingItems: [],
      recentActivity,
      issues: transformedIssues,
      pinnedRepositories: [], // Will be merged from store in Overview component
      ciAlerts: [], // TODO: Implement CI status checking
      healthSnapshot: undefined, // TODO: Implement health snapshot
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return empty data structure on error
    return {
      metrics: [
        {
          id: "active-repos",
          label: "Active Repositories",
          value: "0",
          change: { value: 0, isPositive: true },
        },
        {
          id: "open-prs",
          label: "Open Pull Requests",
          value: "0",
          change: { value: 0, isPositive: false },
        },
        {
          id: "open-issues",
          label: "Open Issues",
          value: "0",
          change: { value: 0, isPositive: false },
        },
        {
          id: "contributions",
          label: "Contributions",
          value: "0",
          change: { value: 0, isPositive: true },
        },
      ],
      notification: null,
      pendingItems: [],
      recentActivity: [],
      issues: [],
      pinnedRepositories: [],
      ciAlerts: [],
      healthSnapshot: undefined,
    };
  }
}

/**
 * Formats a number with appropriate suffix (k, M, etc.)
 */
export function formatMetricValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

/**
 * Formats time ago string (e.g., "4h", "2d", "1w")
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  return `${diffWeeks}w`;
}
