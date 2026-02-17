/**
 * Sync Engine
 * Client-side GitHub data sync with caching and rate limiting
 */

// Database
export { clearAllData, db } from "./database";
// Stores
export { useEntityCache } from "./entity-store";
export type { GitHubNotification } from "./github-api";
// API
export {
  fetchNotifications,
  fetchRateLimit,
  fetchRepoWorkflowRuns,
  fetchReviewRequests,
  fetchUser,
  fetchUserIssues,
  fetchUserOrgs,
  fetchUserRepos,
  getOctokit,
  resetOctokit,
} from "./github-api";
export { useFetchQueue, useRateLimitStore } from "./rate-limiter";
// Search
export {
  clearSearchCache,
  searchAllIssues,
  searchAllPRs,
  searchRepositories,
} from "./search";
// Selectors
export {
  type CIAlert,
  // Issue selectors
  computeIssueState,
  // Repo selectors
  computeRepoState,
  type DashboardMetrics,
  // Notification selectors
  type Notification,
  // Activity selectors
  useActivityFeed,
  useCIAlerts,
  // Dashboard selectors
  useDashboardMetrics,
  useIssuesByRepo,
  useIssuesNeedingAttention,
  useMyOpenPRs,
  useNotifications,
  usePinnedReposEnriched,
  // PR selectors
  usePRsNeedingReview,
  useRecentIssuesForHome,
  useRecentPRsForHome,
  useRecentRepos,
} from "./selectors";

// Orchestrator
export {
  destroySyncOrchestrator,
  getSyncOrchestrator,
  useSyncEngine,
} from "./sync-orchestrator";
// Types
export * from "./types";
