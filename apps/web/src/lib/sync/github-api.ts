/**
 * GitHub API Wrapper
 * Handles conditional requests (ETags), rate limiting, and response transformation
 */

import { Octokit } from "octokit";
import { STORAGE_KEYS } from "../constants";
import { useRateLimitStore } from "./rate-limiter";
import type {
  ConditionalFetchResult,
  CachedRepo,
  CachedIssue,
  CachedPullRequest,
  CachedWorkflowRun,
  CachedNotification,
  CachedOrg,
} from "./types";

// =============================================================================
// Octokit Instance Management
// =============================================================================

let octokitInstance: Octokit | null = null;

export function getOctokit(): Octokit | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
  if (!token) return null;

  if (!octokitInstance) {
    octokitInstance = new Octokit({ auth: token });
  }

  return octokitInstance;
}

export function resetOctokit(): void {
  octokitInstance = null;
}

// =============================================================================
// Rate Limit Header Parser
// =============================================================================

function parseRateLimitHeaders(headers: Record<string, unknown>): {
  remaining: number;
  limit: number;
  resetAt: number;
} {
  return {
    remaining: Number(headers["x-ratelimit-remaining"]) || 5000,
    limit: Number(headers["x-ratelimit-limit"]) || 5000,
    resetAt: Number(headers["x-ratelimit-reset"]) || 0,
  };
}

function updateRateLimitFromHeaders(headers: Record<string, unknown>): void {
  const { remaining, limit, resetAt } = parseRateLimitHeaders(headers);
  useRateLimitStore.getState().updateRateLimit(remaining, limit, resetAt);
}

// =============================================================================
// Conditional Fetch Wrapper
// =============================================================================

interface ConditionalRequestOptions {
  etag?: string;
  lastModified?: string;
}

async function conditionalRequest<T>(
  request: () => Promise<{ data: T; headers: Record<string, unknown> }>,
  _options: ConditionalRequestOptions = {}
): Promise<ConditionalFetchResult<T>> {
  try {
    const response = await request();

    // Update rate limit from response
    const rateLimit = parseRateLimitHeaders(response.headers);
    updateRateLimitFromHeaders(response.headers);

    return {
      modified: true,
      data: response.data,
      etag: response.headers.etag as string | undefined,
      rateLimit,
    };
  } catch (error: unknown) {
    // Handle 304 Not Modified
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;

      if (status === 304) {
        // Parse rate limit from error response if available
        const headers =
          (error as { response?: { headers: Record<string, unknown> } }).response
            ?.headers || {};
        const rateLimit = parseRateLimitHeaders(headers);
        updateRateLimitFromHeaders(headers);

        return {
          modified: false,
          rateLimit,
        };
      }
    }

    throw error;
  }
}

// =============================================================================
// Entity Transformers
// =============================================================================

function transformRepo(repo: any): CachedRepo {
  return {
    id: repo.id,
    nodeId: repo.node_id,
    name: repo.name,
    fullName: repo.full_name,
    owner: {
      login: repo.owner.login,
      avatarUrl: repo.owner.avatar_url,
    },
    description: repo.description,
    htmlUrl: repo.html_url,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    language: repo.language,
    openIssuesCount: repo.open_issues_count,
    visibility: repo.visibility,
    defaultBranch: repo.default_branch,
    isPrivate: repo.private,
  };
}

function transformIssue(issue: any): CachedIssue {
  const repoFullName =
    issue.repository?.full_name ||
    issue.repository_url?.split("/").slice(-2).join("/") ||
    "";

  return {
    id: issue.id,
    nodeId: issue.node_id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    htmlUrl: issue.html_url,
    repositoryUrl: issue.repository_url,
    repositoryFullName: repoFullName,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    labels: (issue.labels || [])
      .filter((l: any) => typeof l === "object")
      .map((l: any) => ({
        name: l.name,
        color: l.color,
      })),
    assignees: (issue.assignees || []).map((a: any) => ({
      login: a.login,
      avatarUrl: a.avatar_url,
    })),
    user: {
      login: issue.user?.login || "unknown",
      avatarUrl: issue.user?.avatar_url || "",
    },
    comments: issue.comments || 0,
    isPullRequest: !!issue.pull_request,
  };
}

function transformPullRequest(pr: any): CachedPullRequest {
  const repoFullName =
    pr.base?.repo?.full_name ||
    pr.html_url?.split("/").slice(3, 5).join("/") ||
    "";

  return {
    id: pr.id,
    nodeId: pr.node_id,
    number: pr.number,
    title: pr.title,
    state: pr.merged_at ? "merged" : pr.state,
    htmlUrl: pr.html_url,
    repositoryFullName: repoFullName,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    closedAt: pr.closed_at,
    mergedAt: pr.merged_at,
    draft: pr.draft || false,
    labels: (pr.labels || []).map((l: any) => ({
      name: l.name,
      color: l.color,
    })),
    user: {
      login: pr.user?.login || "unknown",
      avatarUrl: pr.user?.avatar_url || "",
    },
    requestedReviewers: (pr.requested_reviewers || []).map((r: any) => ({
      login: r.login,
      avatarUrl: r.avatar_url,
    })),
    head: {
      ref: pr.head?.ref || "",
      sha: pr.head?.sha || "",
    },
    base: {
      ref: pr.base?.ref || "",
    },
  };
}

function transformWorkflowRun(run: any): CachedWorkflowRun {
  return {
    id: run.id,
    nodeId: run.node_id,
    name: run.name,
    headBranch: run.head_branch,
    headSha: run.head_sha,
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    repositoryFullName: run.repository?.full_name || "",
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

function transformNotification(notification: any): CachedNotification {
  return {
    id: notification.id,
    unread: notification.unread,
    reason: notification.reason,
    updatedAt: notification.updated_at,
    subject: {
      title: notification.subject.title,
      url: notification.subject.url,
      type: notification.subject.type,
    },
    repository: {
      fullName: notification.repository.full_name,
      htmlUrl: notification.repository.html_url,
    },
  };
}

function transformOrg(org: any): CachedOrg {
  return {
    id: org.id,
    login: org.login,
    avatarUrl: org.avatar_url,
    description: org.description,
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch authenticated user
 */
export async function fetchUser(): Promise<ConditionalFetchResult<any>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  return conditionalRequest(async () => {
    const response = await octokit.rest.users.getAuthenticated();
    return {
      data: response.data,
      headers: response.headers as Record<string, unknown>,
    };
  });
}

/**
 * Fetch user's repositories with optional ETag
 */
export async function fetchUserRepos(
  options: {
    etag?: string;
    perPage?: number;
    sort?: "updated" | "pushed" | "full_name";
  } = {}
): Promise<ConditionalFetchResult<CachedRepo[]>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  const { perPage = 100, sort = "updated" } = options;

  return conditionalRequest(
    async () => {
      const response = await octokit.rest.repos.listForAuthenticatedUser({
        sort,
        direction: "desc",
        per_page: perPage,
        type: "all",
        headers: options.etag ? { "If-None-Match": options.etag } : undefined,
      });

      return {
        data: response.data.map(transformRepo),
        headers: response.headers as Record<string, unknown>,
      };
    },
    { etag: options.etag }
  );
}

/**
 * Fetch issues for authenticated user
 */
export async function fetchUserIssues(
  options: {
    etag?: string;
    since?: string;
    filter?: "assigned" | "created" | "mentioned" | "subscribed" | "all";
    state?: "open" | "closed" | "all";
    perPage?: number;
  } = {}
): Promise<ConditionalFetchResult<CachedIssue[]>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  const { filter = "all", state = "open", perPage = 50 } = options;

  return conditionalRequest(
    async () => {
      const response = await octokit.rest.issues.listForAuthenticatedUser({
        filter,
        state,
        sort: "updated",
        direction: "desc",
        per_page: perPage,
        since: options.since,
        headers: options.etag ? { "If-None-Match": options.etag } : undefined,
      });

      return {
        data: response.data.map(transformIssue),
        headers: response.headers as Record<string, unknown>,
      };
    },
    { etag: options.etag }
  );
}

/**
 * Fetch PRs where user is requested for review
 */
export async function fetchReviewRequests(
  options: { etag?: string } = {}
): Promise<ConditionalFetchResult<CachedPullRequest[]>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  return conditionalRequest(
    async () => {
      // Get user first
      const { data: user } = await octokit.rest.users.getAuthenticated();

      // Search for PRs where user is requested as reviewer
      const response = await octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:open review-requested:${user.login}`,
        sort: "updated",
        order: "desc",
        per_page: 50,
        headers: options.etag ? { "If-None-Match": options.etag } : undefined,
      });

      return {
        data: response.data.items.map(transformPullRequest),
        headers: response.headers as Record<string, unknown>,
      };
    },
    { etag: options.etag }
  );
}

/**
 * Fetch notifications
 */
export async function fetchNotifications(
  options: {
    etag?: string;
    all?: boolean;
    since?: string;
    perPage?: number;
  } = {}
): Promise<ConditionalFetchResult<CachedNotification[]>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  const { all = false, perPage = 50 } = options;

  return conditionalRequest(
    async () => {
      const response =
        await octokit.rest.activity.listNotificationsForAuthenticatedUser({
          all,
          per_page: perPage,
          since: options.since,
          headers: options.etag ? { "If-None-Match": options.etag } : undefined,
        });

      return {
        data: response.data.map(transformNotification),
        headers: response.headers as Record<string, unknown>,
      };
    },
    { etag: options.etag }
  );
}

/**
 * Fetch user's organizations
 */
export async function fetchUserOrgs(
  options: { etag?: string } = {}
): Promise<ConditionalFetchResult<CachedOrg[]>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  return conditionalRequest(
    async () => {
      const response =
        await octokit.rest.orgs.listForAuthenticatedUser({
          per_page: 100,
          headers: options.etag ? { "If-None-Match": options.etag } : undefined,
        });

      return {
        data: response.data.map(transformOrg),
        headers: response.headers as Record<string, unknown>,
      };
    },
    { etag: options.etag }
  );
}

/**
 * Fetch workflow runs for a repository
 */
export async function fetchRepoWorkflowRuns(
  owner: string,
  repo: string,
  options: {
    etag?: string;
    branch?: string;
    perPage?: number;
  } = {}
): Promise<ConditionalFetchResult<CachedWorkflowRun[]>> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  const { perPage = 10 } = options;

  return conditionalRequest(
    async () => {
      const response = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: perPage,
        branch: options.branch,
        headers: options.etag ? { "If-None-Match": options.etag } : undefined,
      });

      return {
        data: response.data.workflow_runs.map(transformWorkflowRun),
        headers: response.headers as Record<string, unknown>,
      };
    },
    { etag: options.etag }
  );
}

/**
 * Fetch issues and PRs count for user (for metrics)
 */
export async function fetchUserCounts(): Promise<{
  openIssues: number;
  openPRs: number;
}> {
  const octokit = getOctokit();
  if (!octokit) throw new Error("No authentication");

  const { data: user } = await octokit.rest.users.getAuthenticated();

  const [issuesResult, prsResult] = await Promise.allSettled([
    octokit.rest.search.issuesAndPullRequests({
      q: `is:issue is:open involves:${user.login}`,
      per_page: 1,
    }),
    octokit.rest.search.issuesAndPullRequests({
      q: `is:pr is:open involves:${user.login}`,
      per_page: 1,
    }),
  ]);

  return {
    openIssues:
      issuesResult.status === "fulfilled"
        ? issuesResult.value.data.total_count
        : 0,
    openPRs:
      prsResult.status === "fulfilled"
        ? prsResult.value.data.total_count
        : 0,
  };
}

/**
 * Fetch rate limit status
 */
export async function fetchRateLimit(): Promise<void> {
  const octokit = getOctokit();
  if (!octokit) return;

  try {
    const { headers } = await octokit.rest.rateLimit.get();
    updateRateLimitFromHeaders(headers as Record<string, unknown>);
  } catch (error) {
    console.error("[Sync] Failed to fetch rate limit:", error);
  }
}

