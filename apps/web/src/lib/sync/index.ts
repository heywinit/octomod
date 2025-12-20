/**
 * Sync Engine
 * Client-side GitHub data sync with caching and rate limiting
 */

// Types
export * from "./types";

// Stores
export { useEntityCache } from "./entity-store";
export { useRateLimitStore, useFetchQueue } from "./rate-limiter";

// API
export {
  getOctokit,
  resetOctokit,
  fetchUser,
  fetchUserRepos,
  fetchUserIssues,
  fetchReviewRequests,
  fetchNotifications,
  fetchUserOrgs,
  fetchRepoWorkflowRuns,
  fetchUserCounts,
  fetchRateLimit,
} from "./github-api";

// Orchestrator
export {
  getSyncOrchestrator,
  destroySyncOrchestrator,
  useSyncEngine,
} from "./sync-orchestrator";

// Selectors
export {
  // Issue selectors
  computeIssueState,
  useIssuesNeedingAttention,
  useIssuesByRepo,
  // PR selectors
  usePRsNeedingReview,
  useMyOpenPRs,
  // Repo selectors
  computeRepoState,
  usePinnedReposEnriched,
  useRecentRepos,
  // Notification selectors
  useNotificationsByReason,
  // Activity selectors
  useActivityFeed,
  // Dashboard selectors
  useDashboardMetrics,
  useCIAlerts,
  type DashboardMetrics,
  type CIAlert,
} from "./selectors";

