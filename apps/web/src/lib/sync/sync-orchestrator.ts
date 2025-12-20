/**
 * Sync Orchestrator
 * Manages the sync lifecycle: bootstrap, background sync, and visibility-driven fetching
 */

import { useEntityCache } from "./entity-store";
import { useRateLimitStore, useFetchQueue } from "./rate-limiter";
import {
  fetchUser,
  fetchUserRepos,
  fetchUserIssues,
  fetchReviewRequests,
  fetchUserOrgs,
  fetchRepoWorkflowRuns,
  fetchRateLimit,
  getOctokit,
  resetOctokit,
} from "./github-api";
import { FetchPriority, DEFAULT_SYNC_CONFIG } from "./types";
import type { SyncEngineConfig } from "./types";
import { useCallback } from "react";

// =============================================================================
// Sync State
// =============================================================================

let backgroundSyncInterval: ReturnType<typeof setInterval> | null = null;
let isBootstrapping = false;
let isInitialized = false;
let lastVisibilityChange = 0;

// =============================================================================
// Sync Orchestrator Class
// =============================================================================

class SyncOrchestrator {
  private config: SyncEngineConfig;
  private onSyncComplete?: () => void;

  constructor(config: Partial<SyncEngineConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
  }

  /**
   * Initialize the sync engine
   * Call this on app startup
   */
  async initialize(options: { onSyncComplete?: () => void } = {}): Promise<void> {
    // Prevent re-initialization if already initialized
    if (isInitialized) {
      console.log("[Sync] Already initialized, skipping");
      this.onSyncComplete = options.onSyncComplete;
      return;
    }

    this.onSyncComplete = options.onSyncComplete;

    // Check if we have a token
    const octokit = getOctokit();
    if (!octokit) {
      console.log("[Sync] No auth token, skipping initialization");
      return;
    }

    // Set up visibility change listener
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Set up network change listener
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }

    // Fetch rate limit first
    await fetchRateLimit();

    // Run bootstrap sync
    await this.bootstrapSync();

    // Start background sync
    this.startBackgroundSync();

    isInitialized = true;
  }

  /**
   * Cleanup on logout or unmount
   */
  destroy(): void {
    this.stopBackgroundSync();
    useFetchQueue.getState().clearQueue();

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }

    resetOctokit();
    isInitialized = false;
  }

  /**
   * Bootstrap Sync
   * Runs on app load to populate initial data
   */
  async bootstrapSync(): Promise<void> {
    if (isBootstrapping) return;
    isBootstrapping = true;

    const entityCache = useEntityCache.getState();
    entityCache.setSyncStatus("syncing");

    console.log("[Sync] Starting bootstrap sync");

    try {
      // Step 1: Render from cache immediately (already done by Zustand persist)
      // UI should already be showing cached data

      // Step 2: Priority fetch (blocking) - Critical data for home page
      await this.priorityFetch();

      // Step 3: Background fetch (deferred) - Less critical data
      this.deferredFetch();

      entityCache.setSyncStatus("idle");
      entityCache.updateLastSync();

      console.log("[Sync] Bootstrap sync complete");
      this.onSyncComplete?.();
    } catch (error) {
      console.error("[Sync] Bootstrap sync failed:", error);
      entityCache.setSyncStatus("error", String(error));
    } finally {
      isBootstrapping = false;
    }
  }

  /**
   * Priority Fetch
   * Fetches critical data needed for the home page
   */
  private async priorityFetch(): Promise<void> {
    const entityCache = useEntityCache.getState();

    // Fetch in parallel
    const results = await Promise.allSettled([
      fetchUser(),
      fetchUserIssues({ filter: "all", state: "open" }),
      fetchReviewRequests(),
      fetchUserOrgs(),
    ]);

    // Process results
    const [userResult, issuesResult, reviewsResult, orgsResult] = results;

    // User data - handled by auth store, but we can cache it
    if (userResult.status === "fulfilled" && userResult.value.modified) {
      console.log("[Sync] User data updated");
    }

    // Issues
    if (issuesResult.status === "fulfilled") {
      const { modified, data, etag } = issuesResult.value;
      if (modified && data) {
        entityCache.upsertIssues(data, { etag });
        console.log(`[Sync] Cached ${data.length} issues`);
      } else {
        console.log("[Sync] Issues not modified (304)");
      }
    }

    // Review requests (PRs)
    if (reviewsResult.status === "fulfilled") {
      const { modified, data, etag } = reviewsResult.value;
      if (modified && data) {
        entityCache.upsertPullRequests(data, { etag });
        console.log(`[Sync] Cached ${data.length} review requests`);
      }
    }

    // Organizations
    if (orgsResult.status === "fulfilled") {
      const { modified, data, etag } = orgsResult.value;
      if (modified && data) {
        entityCache.upsertOrgs(data, { etag });
        console.log(`[Sync] Cached ${data.length} orgs`);
      }
    }
  }

  /**
   * Deferred Fetch
   * Fetches less critical data in the background
   */
  private deferredFetch(): void {
    const fetchQueue = useFetchQueue.getState();
    const entityCache = useEntityCache.getState();

    // Fetch repos (normal priority)
    fetchQueue.addJob({
      priority: FetchPriority.NORMAL,
      entityType: "repos",
      execute: async () => {
        const result = await fetchUserRepos({ perPage: 100, sort: "updated" });
        if (result.modified && result.data) {
          entityCache.upsertRepos(result.data, { etag: result.etag });
          console.log(`[Sync] Cached ${result.data.length} repos`);
        }
      },
    });

    // Fetch workflow runs for pinned repos (if any)
    // This would be triggered by the pinned repos store
  }

  /**
   * Background Sync
   * Runs periodically to keep data fresh
   */
  startBackgroundSync(): void {
    if (backgroundSyncInterval) return;

    console.log("[Sync] Starting background sync");

    backgroundSyncInterval = setInterval(() => {
      this.runBackgroundSync();
    }, this.config.backgroundSyncInterval);
  }

  stopBackgroundSync(): void {
    if (backgroundSyncInterval) {
      clearInterval(backgroundSyncInterval);
      backgroundSyncInterval = null;
      console.log("[Sync] Stopped background sync");
    }
  }

  private async runBackgroundSync(): Promise<void> {
    // Skip if document is hidden
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    // Skip if rate limited
    const rateLimitStore = useRateLimitStore.getState();
    if (rateLimitStore.isRateLimited()) {
      console.log("[Sync] Skipping background sync - rate limited");
      return;
    }

    const entityCache = useEntityCache.getState();
    const fetchQueue = useFetchQueue.getState();

    // Queue background refresh jobs
    fetchQueue.addJob({
      priority: FetchPriority.LOW,
      entityType: "issues",
      execute: async () => {
        const since = entityCache.cursors.user
          ? new Date(entityCache.cursors.user).toISOString()
          : undefined;

        const result = await fetchUserIssues({ since, state: "open" });
        if (result.modified && result.data) {
          entityCache.upsertIssues(result.data, { etag: result.etag });
          entityCache.updateCursor("user", Date.now());
        }
      },
    });
  }

  /**
   * Visibility Change Handler
   * Revalidate when tab becomes visible
   */
  private handleVisibilityChange = (): void => {
    if (typeof document === "undefined") return;

    if (!document.hidden) {
      const now = Date.now();
      // Debounce - only sync if more than 30 seconds since last change
      if (now - lastVisibilityChange > 30000) {
        console.log("[Sync] Tab visible - revalidating");
        this.runBackgroundSync();
      }
      lastVisibilityChange = now;
    }
  };

  /**
   * Online Handler
   * Resume syncing when network is restored
   */
  private handleOnline = (): void => {
    console.log("[Sync] Network restored - resuming sync");
    useEntityCache.getState().setSyncStatus("idle");
    this.runBackgroundSync();
  };

  /**
   * Offline Handler
   * Pause syncing when network is lost
   */
  private handleOffline = (): void => {
    console.log("[Sync] Network lost - pausing sync");
    useEntityCache.getState().setSyncStatus("offline");
  };

  /**
   * Manual Refresh
   * User-triggered full refresh
   */
  async manualRefresh(): Promise<void> {
    const rateLimitStore = useRateLimitStore.getState();

    if (rateLimitStore.isRateLimited()) {
      const timeUntilReset = rateLimitStore.getTimeUntilReset();
      console.warn(
        `[Sync] Rate limited. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds`
      );
      return;
    }

    console.log("[Sync] Manual refresh triggered");
    await this.priorityFetch();
    useEntityCache.getState().updateLastSync();
  }

  /**
   * Fetch Workflow Runs for Pinned Repos
   */
  async fetchWorkflowsForPinnedRepos(
    pinnedRepos: Array<{ owner: string; name: string; fullName: string }>
  ): Promise<void> {
    const entityCache = useEntityCache.getState();
    const fetchQueue = useFetchQueue.getState();

    for (const repo of pinnedRepos) {
      fetchQueue.addJob({
        priority: FetchPriority.HIGH,
        entityType: "workflowRuns",
        entityId: repo.fullName,
        execute: async () => {
          try {
            const result = await fetchRepoWorkflowRuns(repo.owner, repo.name, {
              perPage: 5,
            });

            if (result.modified && result.data) {
              entityCache.upsertWorkflowRuns(result.data, { etag: result.etag });
              entityCache.updateRepoCursor(repo.fullName, "workflows", Date.now());
            }
          } catch (error) {
            // Silently fail for workflow runs - might not have access
            console.log(`[Sync] Could not fetch workflows for ${repo.fullName}`);
          }
        },
      });
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let syncOrchestrator: SyncOrchestrator | null = null;

export function getSyncOrchestrator(): SyncOrchestrator {
  if (!syncOrchestrator) {
    syncOrchestrator = new SyncOrchestrator();
  }
  return syncOrchestrator;
}

export function destroySyncOrchestrator(): void {
  if (syncOrchestrator) {
    syncOrchestrator.destroy();
    syncOrchestrator = null;
  }
}

export function useSyncEngine() {
  const entityCache = useEntityCache();
  const rateLimitStore = useRateLimitStore();

  // Note: Sync initialization is handled by SyncProvider
  // This hook only provides access to sync state and actions

  // Manual refresh handler
  const refresh = useCallback(async () => {
    const orchestrator = getSyncOrchestrator();
    await orchestrator.manualRefresh();
  }, []);

  // Fetch workflows for pinned repos
  const fetchWorkflowsForPinned = useCallback(
    async (repos: Array<{ owner: string; name: string; fullName: string }>) => {
      const orchestrator = getSyncOrchestrator();
      await orchestrator.fetchWorkflowsForPinnedRepos(repos);
    },
    []
  );

  // Derived state
  const syncStatus = entityCache.syncState.status;
  const lastSyncAt = entityCache.syncState.lastSyncAt;
  const isDegraded = entityCache.syncState.isDegraded;
  const isRateLimited = rateLimitStore.isRateLimited();
  const rateLimitRemaining = rateLimitStore.rateLimit.remaining;

  return {
    // Status
    syncStatus,
    lastSyncAt,
    isDegraded,
    isRateLimited,
    rateLimitRemaining,

    // Actions
    refresh,
    fetchWorkflowsForPinned,

    // Entity access (for convenience)
    repos: entityCache.repos,
    issues: entityCache.issues,
    pullRequests: entityCache.pullRequests,
    workflowRuns: entityCache.workflowRuns,
    orgs: entityCache.orgs,

    // Query helpers
    getOpenIssues: entityCache.getOpenIssues,
    getOpenPRs: entityCache.getOpenPRs,
  };
}

