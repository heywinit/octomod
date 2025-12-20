/**
 * Sync Engine Types
 * Core type definitions for the client-side sync engine
 */

// =============================================================================
// Sync Metadata
// =============================================================================

export interface SyncMeta {
  /** ETag from GitHub response for conditional requests */
  etag?: string;
  /** Timestamp of last successful fetch */
  lastFetchedAt?: number;
  /** GitHub's updated_at timestamp for the entity */
  githubUpdatedAt?: string;
  /** Whether the entity is currently being fetched */
  isFetching?: boolean;
  /** Last error message if fetch failed */
  lastError?: string;
}

// =============================================================================
// Entity Types (GitHub Data)
// =============================================================================

export interface CachedRepo {
  id: number;
  nodeId: string;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  description: string | null;
  htmlUrl: string;
  updatedAt: string;
  pushedAt: string;
  stargazersCount: number;
  forksCount: number;
  language: string | null;
  openIssuesCount: number;
  visibility: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface CachedIssue {
  id: number;
  nodeId: string;
  number: number;
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  repositoryUrl: string;
  repositoryFullName: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatarUrl: string }>;
  user: { login: string; avatarUrl: string };
  comments: number;
  isPullRequest: boolean;
}

export interface CachedPullRequest {
  id: number;
  nodeId: string;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  htmlUrl: string;
  repositoryFullName: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  draft: boolean;
  labels: Array<{ name: string; color: string }>;
  user: { login: string; avatarUrl: string };
  requestedReviewers: Array<{ login: string; avatarUrl: string }>;
  head: { ref: string; sha: string };
  base: { ref: string };
}

export interface CachedWorkflowRun {
  id: number;
  nodeId: string;
  name: string;
  headBranch: string;
  headSha: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  htmlUrl: string;
  repositoryFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CachedNotification {
  id: string;
  unread: boolean;
  reason: string;
  updatedAt: string;
  subject: {
    title: string;
    url: string | null;
    type: string;
  };
  repository: {
    fullName: string;
    htmlUrl: string;
  };
}

export interface CachedOrg {
  id: number;
  login: string;
  avatarUrl: string;
  description: string | null;
}

// =============================================================================
// Entity State Container
// =============================================================================

export interface EntityState<T> {
  /** Entities keyed by their ID (as string) */
  byId: Record<string, T>;
  /** Sync metadata keyed by entity ID */
  meta: Record<string, SyncMeta>;
  /** All entity IDs for iteration */
  allIds: string[];
}

// =============================================================================
// Rate Limit State
// =============================================================================

export interface RateLimitState {
  /** Remaining requests in current window */
  remaining: number;
  /** Total limit for current window */
  limit: number;
  /** Unix timestamp when rate limit resets */
  resetAt: number;
  /** When we last updated this info */
  lastUpdatedAt: number;
}

// =============================================================================
// Sync Cursors
// =============================================================================

export interface SyncCursors {
  /** User data cursor (last sync timestamp) */
  user?: number;
  /** Per-org cursors */
  orgs: Record<string, number>;
  /** Per-repo cursors for issues/PRs */
  repos: Record<string, { issues?: number; prs?: number; workflows?: number }>;
  /** Notifications cursor */
  notifications?: number;
}

// =============================================================================
// Fetch Priority
// =============================================================================

export enum FetchPriority {
  /** Inbox, alerts - always fetch */
  CRITICAL = 0,
  /** Pinned repos, user data */
  HIGH = 1,
  /** Activity feed, recent repos */
  NORMAL = 2,
  /** Background refresh, prefetch */
  LOW = 3,
}

// =============================================================================
// Fetch Job
// =============================================================================

export interface FetchJob {
  /** Unique job ID */
  id: string;
  /** Job priority */
  priority: FetchPriority;
  /** The fetch function to execute */
  execute: () => Promise<void>;
  /** Optional: entity type being fetched */
  entityType?: string;
  /** Optional: entity ID being fetched */
  entityId?: string;
  /** Number of retry attempts */
  retries: number;
  /** When the job was created */
  createdAt: number;
}

// =============================================================================
// Sync Status
// =============================================================================

export type SyncStatus =
  | "idle"
  | "syncing"
  | "rate-limited"
  | "error"
  | "offline";

export interface SyncState {
  /** Current sync status */
  status: SyncStatus;
  /** Last successful full sync */
  lastSyncAt?: number;
  /** Current error message if any */
  error?: string;
  /** Whether we're in degraded mode due to rate limits */
  isDegraded: boolean;
  /** Number of pending jobs in queue */
  pendingJobs: number;
}

// =============================================================================
// Conditional Request Result
// =============================================================================

export interface ConditionalFetchResult<T> {
  /** Whether the data was modified (false = 304 Not Modified) */
  modified: boolean;
  /** The data if modified, undefined if not modified */
  data?: T;
  /** New ETag from response */
  etag?: string;
  /** Rate limit info from response headers */
  rateLimit: {
    remaining: number;
    limit: number;
    resetAt: number;
  };
}

// =============================================================================
// Derived State Types (computed locally)
// =============================================================================

export interface DerivedIssueState {
  /** Whether this issue needs your attention */
  needsAttention: boolean;
  /** Whether the issue is stale */
  isStale: boolean;
  /** How urgent this issue is (1-5) */
  urgencyScore: number;
}

export interface DerivedRepoState {
  /** Whether CI is failing */
  ciStatus: "passing" | "failing" | "pending" | "unknown";
  /** Number of issues needing attention */
  issuesNeedingAttention: number;
  /** Whether the repo is stale */
  isStale: boolean;
  /** Health score (0-100) */
  healthScore: number;
}

// =============================================================================
// Sync Engine Configuration
// =============================================================================

export interface SyncEngineConfig {
  /** Minimum remaining rate limit before pausing non-critical requests */
  rateLimitSafeThreshold: number;
  /** Minimum remaining rate limit before pausing all requests */
  rateLimitCriticalThreshold: number;
  /** Background sync interval in milliseconds */
  backgroundSyncInterval: number;
  /** How long before considering data stale (ms) */
  staleThreshold: number;
  /** Maximum retry attempts for failed requests */
  maxRetries: number;
  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: number;
}

export const DEFAULT_SYNC_CONFIG: SyncEngineConfig = {
  rateLimitSafeThreshold: 100,
  rateLimitCriticalThreshold: 30,
  backgroundSyncInterval: 30000, // 30 seconds
  staleThreshold: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryBaseDelay: 1000,
};

