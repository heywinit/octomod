/**
 * Derived State Selectors
 * Compute local state from cached GitHub data
 */

import { useMemo } from "react";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { useAuthStore } from "@/stores/auth";
import { usePinnedRepos } from "@/stores/pinned-repos";
import { useEntityCache } from "./entity-store";
import type {
  CachedIssue,
  CachedRepo,
  CachedWorkflowRun,
  DerivedIssueState,
  DerivedRepoState,
} from "./types";

// =============================================================================
// Constants
// =============================================================================

const STALE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// =============================================================================
// Issue Selectors
// =============================================================================

/**
 * Compute derived state for an issue
 */
export function computeIssueState(
  issue: CachedIssue,
  currentUserLogin: string,
): DerivedIssueState {
  const now = Date.now();
  const updatedAt = new Date(issue.updatedAt).getTime();
  const timeSinceUpdate = now - updatedAt;

  // Check if assigned to current user
  const isAssigned = issue.assignees.some((a) => a.login === currentUserLogin);

  // Check if issue is stale
  const isStale = timeSinceUpdate > STALE_THRESHOLD_MS;

  // Check if needs attention (assigned, open, recent activity)
  const needsAttention =
    isAssigned &&
    issue.state === "open" &&
    timeSinceUpdate < URGENT_THRESHOLD_MS;

  // Calculate urgency score (1-5)
  let urgencyScore = 1;
  if (isAssigned) urgencyScore += 1;
  if (timeSinceUpdate < URGENT_THRESHOLD_MS) urgencyScore += 1;
  if (issue.comments > 5) urgencyScore += 1;
  if (issue.labels.some((l) => l.name.toLowerCase().includes("urgent")))
    urgencyScore += 1;

  return {
    needsAttention,
    isStale,
    urgencyScore: Math.min(5, urgencyScore),
  };
}

/**
 * Get issues that need attention
 */
export function useIssuesNeedingAttention(currentUserLogin: string) {
  const { issues } = useEntityCache();

  return useMemo(() => {
    return Object.values(issues.byId)
      .filter((issue) => {
        if (issue.state !== "open" || issue.isPullRequest) return false;
        const derived = computeIssueState(issue, currentUserLogin);
        return derived.needsAttention;
      })
      .sort((a, b) => {
        const aState = computeIssueState(a, currentUserLogin);
        const bState = computeIssueState(b, currentUserLogin);
        return bState.urgencyScore - aState.urgencyScore;
      });
  }, [issues.byId, currentUserLogin]);
}

/**
 * Get issues grouped by repository
 */
export function useIssuesByRepo() {
  const { issues } = useEntityCache();

  return useMemo(() => {
    const grouped: Record<string, CachedIssue[]> = {};

    for (const issue of Object.values(issues.byId)) {
      if (issue.isPullRequest) continue;
      const repo = issue.repositoryFullName;
      if (!grouped[repo]) {
        grouped[repo] = [];
      }
      grouped[repo].push(issue);
    }

    // Sort issues within each repo by updated_at
    for (const repo of Object.keys(grouped)) {
      grouped[repo].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }

    return grouped;
  }, [issues.byId]);
}

// =============================================================================
// Pull Request Selectors
// =============================================================================

/**
 * Get PRs waiting for your review
 */
export function usePRsNeedingReview(currentUserLogin: string) {
  const { pullRequests } = useEntityCache();

  return useMemo(() => {
    return Object.values(pullRequests.byId)
      .filter(
        (pr) =>
          pr.state === "open" &&
          pr.requestedReviewers.some((r) => r.login === currentUserLogin),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [pullRequests.byId, currentUserLogin]);
}

/**
 * Get user's own open PRs
 */
export function useMyOpenPRs(currentUserLogin: string) {
  const { pullRequests } = useEntityCache();

  return useMemo(() => {
    return Object.values(pullRequests.byId)
      .filter((pr) => pr.state === "open" && pr.user.login === currentUserLogin)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [pullRequests.byId, currentUserLogin]);
}

// =============================================================================
// Repository Selectors
// =============================================================================

/**
 * Compute derived state for a repository
 */
export function computeRepoState(
  repo: CachedRepo,
  workflowRuns: CachedWorkflowRun[],
  issues: CachedIssue[],
): DerivedRepoState {
  const now = Date.now();
  const updatedAt = new Date(repo.updatedAt).getTime();
  const timeSinceUpdate = now - updatedAt;

  // Determine CI status from latest workflow runs
  let ciStatus: DerivedRepoState["ciStatus"] = "unknown";
  if (workflowRuns.length > 0) {
    const latestRun = workflowRuns[0];
    if (latestRun.status === "completed") {
      ciStatus =
        latestRun.conclusion === "success"
          ? "passing"
          : latestRun.conclusion === "failure"
            ? "failing"
            : "unknown";
    } else {
      ciStatus = "pending";
    }
  }

  // Count issues needing attention
  const issuesNeedingAttention = issues.filter(
    (issue) =>
      issue.state === "open" &&
      !issue.isPullRequest &&
      new Date(issue.updatedAt).getTime() > now - URGENT_THRESHOLD_MS,
  ).length;

  // Check if repo is stale
  const isStale = timeSinceUpdate > STALE_THRESHOLD_MS;

  // Calculate health score
  let healthScore = 100;
  if (ciStatus === "failing") healthScore -= 30;
  if (isStale) healthScore -= 20;
  if (issuesNeedingAttention > 5) healthScore -= 20;
  else if (issuesNeedingAttention > 0) healthScore -= 10;

  return {
    ciStatus,
    issuesNeedingAttention,
    isStale,
    healthScore: Math.max(0, healthScore),
  };
}

/**
 * Get pinned repos with enriched data
 */
export function usePinnedReposEnriched() {
  const { pinnedRepos } = usePinnedRepos();
  const { repos, workflowRuns, issues } = useEntityCache();

  return useMemo(() => {
    return pinnedRepos.map((pinned) => {
      const cached = Object.values(repos.byId).find(
        (r) => r.fullName === pinned.fullName,
      );
      const repoWorkflows = Object.values(workflowRuns.byId).filter(
        (w) => w.repositoryFullName === pinned.fullName,
      );
      const repoIssues = Object.values(issues.byId).filter(
        (i) => i.repositoryFullName === pinned.fullName,
      );

      const derivedState = cached
        ? computeRepoState(cached, repoWorkflows, repoIssues)
        : {
            ciStatus: "unknown" as const,
            issuesNeedingAttention: 0,
            isStale: false,
            healthScore: 100,
          };

      return {
        ...pinned,
        cached,
        ...derivedState,
        openIssueCount: repoIssues.filter(
          (i) => i.state === "open" && !i.isPullRequest,
        ).length,
        lastActivity: cached?.updatedAt,
      };
    });
  }, [pinnedRepos, repos.byId, workflowRuns.byId, issues.byId]);
}

/**
 * Get repos sorted by recent activity
 */
export function useRecentRepos(limit = 10) {
  const { repos } = useEntityCache();

  return useMemo(() => {
    return Object.values(repos.byId)
      .sort(
        (a, b) =>
          new Date(b.pushedAt || b.updatedAt).getTime() -
          new Date(a.pushedAt || a.updatedAt).getTime(),
      )
      .slice(0, limit);
  }, [repos.byId, limit]);
}

/**
 * Get issues formatted for display on the home page
 * Shows recent open issues that need attention
 */
export function useRecentIssuesForHome(limit = 7) {
  const { issues } = useEntityCache();

  return useMemo(() => {
    return Object.values(issues.byId)
      .filter((issue) => issue.state === "open" && !issue.isPullRequest)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, limit)
      .map((issue) => ({
        id: String(issue.id),
        number: issue.number,
        title: issue.title,
        repository: issue.repositoryFullName,
        state: issue.state,
        url: issue.htmlUrl,
        timeAgo: formatTimeAgo(new Date(issue.updatedAt)),
        labels: issue.labels.map((l) => l.name),
      }));
  }, [issues.byId, limit]);
}

/**
 * Get PRs formatted for display on the home page
 */
export function useRecentPRsForHome(limit = 5) {
  const { pullRequests } = useEntityCache();

  return useMemo(() => {
    return Object.values(pullRequests.byId)
      .filter((pr) => pr.state === "open")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, limit)
      .map((pr) => ({
        id: String(pr.id),
        number: pr.number,
        title: pr.title,
        repository: pr.repositoryFullName,
        state: pr.state,
        url: pr.htmlUrl,
        timeAgo: formatTimeAgo(new Date(pr.updatedAt)),
        isReviewRequested: true,
      }));
  }, [pullRequests.byId, limit]);
}

interface ActivityItem {
  id: string;
  type: "issue" | "pr";
  title: string;
  description: string;
  updatedAt: string;
  url: string;
  repository: string;
  user: { login: string; avatarUrl: string };
  state: "open" | "closed" | "merged";
  labels: Array<{ name: string; color: string }>;
  comments: number;
  isAssignedToYou: boolean;
  isReviewRequested: boolean;
  isDraft: boolean;
}

/**
 * Generate activity feed from cached data
 */
export function useActivityFeed(limit = 20) {
  const { issues, pullRequests } = useEntityCache();
  const user = useAuthStore((state) => state.user);
  const currentUserLogin = user?.login;

  return useMemo(() => {
    const activities: ActivityItem[] = [];

    // Get all issues and PRs from last 14 days, sort by updatedAt desc
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const allIssues = Object.values(issues.byId)
      .filter((i) => !i.isPullRequest)
      .filter((i) => new Date(i.updatedAt).getTime() > fourteenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    const allPRs = Object.values(pullRequests.byId)
      .filter((pr) => new Date(pr.updatedAt).getTime() > fourteenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    // Add recent issues
    for (const issue of allIssues.slice(0, limit)) {
      const isAssignedToYou = issue.assignees.some(
        (a) => a.login === currentUserLogin,
      );
      const primaryLabel = issue.labels[0]?.name;

      let description = "";
      if (issue.state === "open") {
        if (isAssignedToYou) {
          description = `assigned to you${primaryLabel ? ` (${primaryLabel})` : ""}`;
        } else {
          description = `opened${primaryLabel ? ` in ${primaryLabel}` : ""}`;
        }
      } else {
        description = issue.state === "closed" ? "closed" : "reopened";
      }

      activities.push({
        id: `issue-${issue.id}`,
        type: "issue",
        title: issue.title,
        description,
        updatedAt: issue.updatedAt,
        url: issue.htmlUrl,
        repository: issue.repositoryFullName,
        user: issue.user,
        state: issue.state,
        labels: issue.labels,
        comments: issue.comments,
        isAssignedToYou,
        isReviewRequested: false,
        isDraft: false,
      });
    }

    // Add recent PRs
    for (const pr of allPRs.slice(0, limit)) {
      const isReviewRequested = pr.requestedReviewers.some(
        (r) => r.login === currentUserLogin,
      );
      const isAssignedToYou = pr.requestedReviewers.some(
        (r) => r.login === currentUserLogin,
      );
      const primaryLabel = pr.labels[0]?.name;

      let description = "";
      if (pr.draft) {
        description = "draft PR";
      } else if (pr.mergedAt) {
        description = "merged";
      } else if (pr.state === "closed") {
        description = "closed";
      } else if (isReviewRequested) {
        description = `review requested${primaryLabel ? ` (${primaryLabel})` : ""}`;
      } else {
        description = `opened${primaryLabel ? ` in ${primaryLabel}` : ""}`;
      }

      activities.push({
        id: `pr-${pr.id}`,
        type: "pr",
        title: pr.title,
        description,
        updatedAt: pr.updatedAt,
        url: pr.htmlUrl,
        repository: pr.repositoryFullName,
        user: pr.user,
        state: pr.state,
        labels: pr.labels,
        comments: 0,
        isAssignedToYou,
        isReviewRequested,
        isDraft: pr.draft,
      });
    }

    // Sort by updated_at and deduplicate by repository + title
    const seen = new Set<string>();
    return activities
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .filter((item) => {
        const key = `${item.repository}:${item.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  }, [issues.byId, pullRequests.byId, limit, currentUserLogin]);
}

// =============================================================================
// Dashboard Metrics Selector
// =============================================================================

export interface DashboardMetrics {
  activeRepos: number;
  openIssues: number;
  openPRs: number;
  reposNeedingAttention: number;
  reposNeedingAttentionList: string[];
}

/**
 * Compute dashboard metrics from cached data
 */
export function useDashboardMetrics(): DashboardMetrics {
  const { repos, issues, pullRequests } = useEntityCache();

  return useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const activeRepos = Object.values(repos.byId).filter(
      (repo) => new Date(repo.updatedAt).getTime() > thirtyDaysAgo,
    ).length;

    const openIssues = Object.values(issues.byId).filter(
      (issue) => issue.state === "open" && !issue.isPullRequest,
    ).length;

    const openPRs = Object.values(pullRequests.byId).filter(
      (pr) => pr.state === "open",
    ).length;

    // Repos needing attention = repos with open issues
    const reposWithIssues = Object.values(repos.byId).filter((repo) => {
      const repoIssues = Object.values(issues.byId).filter(
        (i) =>
          i.repositoryFullName === repo.fullName &&
          i.state === "open" &&
          !i.isPullRequest,
      );
      return repoIssues.length > 0;
    });

    return {
      activeRepos,
      openIssues,
      openPRs,
      reposNeedingAttention: reposWithIssues.length,
      reposNeedingAttentionList: reposWithIssues.map((r) => r.fullName),
    };
  }, [repos.byId, issues.byId, pullRequests.byId]);
}

// =============================================================================
// CI Alerts Selector
// =============================================================================

export interface CIAlert {
  id: string;
  repository: string;
  branch: string;
  workflow: string;
  status: "failure" | "error" | "warning";
  url: string;
}

/**
 * Get CI alerts from workflow runs
 */
export function useCIAlerts(): CIAlert[] {
  const { workflowRuns } = useEntityCache();
  const { pinnedRepos } = usePinnedRepos();

  return useMemo(() => {
    const pinnedFullNames = new Set(pinnedRepos.map((r) => r.fullName));

    return Object.values(workflowRuns.byId)
      .filter(
        (run) =>
          pinnedFullNames.has(run.repositoryFullName) &&
          run.status === "completed" &&
          (run.conclusion === "failure" || run.conclusion === "timed_out"),
      )
      .map((run): CIAlert => {
        let status: "failure" | "error" | "warning";
        if (run.conclusion === "failure") {
          status = "failure";
        } else if (run.conclusion === "timed_out") {
          status = "error";
        } else {
          // This shouldn't happen due to filter, but TypeScript needs this
          status = "error";
        }
        return {
          id: String(run.id),
          repository: run.repositoryFullName,
          branch: run.headBranch,
          workflow: run.name,
          status,
          url: run.htmlUrl,
        };
      })
      .slice(0, 5);
  }, [workflowRuns.byId, pinnedRepos]);
}

// =============================================================================
// Notifications
// =============================================================================

export interface Notification {
  id: string;
  type: "review_requested" | "assigned" | "mention" | "ci_failed";
  title: string;
  description: string;
  repository: string;
  url: string;
  timeAgo: string;
}

export function useNotifications(limit = 10): Notification[] {
  const { issues, pullRequests } = useEntityCache();
  const user = useAuthStore((state) => state.user);
  const currentUserLogin = user?.login;
  const ciAlerts = useCIAlerts();

  return useMemo(() => {
    const notifications: Notification[] = [];

    // Review requests on PRs
    for (const pr of Object.values(pullRequests.byId)) {
      const isReviewRequested = pr.requestedReviewers.some(
        (r) => r.login === currentUserLogin,
      );
      if (isReviewRequested) {
        notifications.push({
          id: `pr-review-${pr.id}`,
          type: "review_requested",
          title: pr.title,
          description: "review requested",
          repository: pr.repositoryFullName,
          url: pr.htmlUrl,
          timeAgo: pr.updatedAt,
        });
      }
    }

    // Assigned issues
    for (const issue of Object.values(issues.byId)) {
      if (issue.isPullRequest) continue;
      const isAssigned = issue.assignees.some(
        (a) => a.login === currentUserLogin,
      );
      if (isAssigned && issue.state === "open") {
        notifications.push({
          id: `issue-assigned-${issue.id}`,
          type: "assigned",
          title: issue.title,
          description: "assigned to you",
          repository: issue.repositoryFullName,
          url: issue.htmlUrl,
          timeAgo: issue.updatedAt,
        });
      }
    }

    // CI failures
    for (const alert of ciAlerts) {
      notifications.push({
        id: `ci-${alert.id}`,
        type: "ci_failed",
        title: `${alert.workflow} failed on ${alert.branch}`,
        description: alert.status === "error" ? "timed out" : alert.status,
        repository: alert.repository,
        url: alert.url,
        timeAgo: alert.repository,
      });
    }

    // Sort and dedupe
    const seen = new Set<string>();
    return notifications
      .sort(
        (a, b) => new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime(),
      )
      .filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      })
      .slice(0, limit);
  }, [issues.byId, pullRequests.byId, ciAlerts, currentUserLogin, limit]);
}
