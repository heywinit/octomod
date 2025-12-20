/**
 * Dashboard Service
 * Provides data structures and types for the dashboard overview
 * This service will later be connected to the GitHub API
 */

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
}

export interface DashboardData {
  metrics: Metric[];
  notification: Notification | null;
  pendingItems: PendingItem[];
  recentActivity: RecentActivity[];
  issues: Issue[];
  pinnedRepositories: PinnedRepository[];
}

/**
 * Fetches dashboard data
 * Currently returns mock data structure - will be replaced with GitHub API calls
 * @returns Dashboard data including metrics, notifications, pending items, and recent activity
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  // TODO: Replace with actual GitHub API calls
  // This structure will be populated with real data from:
  // - User stats (repos, stars, contributions)
  // - Notifications from GitHub
  // - Pending PRs and issues requiring attention
  // - Recent activity feed

  return {
    metrics: [
      {
        id: "active-repos",
        label: "Active Repositories",
        value: "0",
        change: {
          value: 0,
          isPositive: true,
        },
      },
      {
        id: "open-prs",
        label: "Open Pull Requests",
        value: "0",
        change: {
          value: 0,
          isPositive: false,
        },
      },
      {
        id: "open-issues",
        label: "Open Issues",
        value: "0",
        change: {
          value: 0,
          isPositive: false,
        },
      },
      {
        id: "contributions",
        label: "Contributions",
        value: "0",
        change: {
          value: 0,
          isPositive: true,
        },
      },
    ],
    notification: null,
    pendingItems: [],
    recentActivity: [],
    issues: [],
    pinnedRepositories: [],
  };
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
