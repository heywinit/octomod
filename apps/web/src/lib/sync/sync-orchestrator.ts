/**
 * Sync Orchestrator
 * Manages the sync lifecycle: bootstrap, background sync, and visibility-driven fetching
 */

import { useCallback } from "react";
import { useEntityCache } from "./entity-store";
import {
  fetchOrgRepos,
  fetchRateLimit,
  fetchRepoWorkflowRuns,
  fetchUser,
  fetchUserCollaboratorRepos,
  fetchUserMemberRepos,
  fetchUserOrgs,
  fetchUserOwnedRepos,
  getOctokit,
  resetOctokit,
  searchAssignedPRs,
  searchAuthoredPRs,
  searchReviewRequestedPRs,
  searchUserIssues,
} from "./github-api";
import { useFetchQueue, useRateLimitStore } from "./rate-limiter";
import type { CachedIssue, CachedPullRequest, SyncEngineConfig } from "./types";
import { DEFAULT_SYNC_CONFIG, FetchPriority } from "./types";

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
  async initialize(
    options: { onSyncComplete?: () => void } = {},
  ): Promise<void> {
    if (isInitialized) {
      console.log("[Sync] Already initialized, skipping");
      this.onSyncComplete = options.onSyncComplete;
      return;
    }

    this.onSyncComplete = options.onSyncComplete;

    const octokit = getOctokit();
    if (!octokit) {
      console.log("[Sync] No auth token, skipping initialization");
      return;
    }

    if (typeof document !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }

    // Load existing data from IndexedDB first
    await useEntityCache.getState().loadFromDatabase();

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
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
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
      // Priority fetch - critical data
      await this.priorityFetch();

      // Deferred fetch - repos from all sources
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
   * Fetches critical data: user, orgs, issues, PRs
   */
  private async priorityFetch(): Promise<void> {
    const entityCache = useEntityCache.getState();

    // Fetch user (for login)
    const userResult = await fetchUser();
    if (userResult.modified && userResult.data) {
      console.log("[Sync] User data updated:", userResult.data.login);
    }

    // Fetch orgs first (needed for org repos)
    const orgsResult = await fetchUserOrgs();
    if (orgsResult.modified && orgsResult.data) {
      entityCache.upsertOrgs(orgsResult.data, { etag: orgsResult.etag });
      console.log(`[Sync] Cached ${orgsResult.data.length} orgs`);
    }

    // Fetch issues involving the user (author, assignee, mentioned)
    const issuesResult = await searchUserIssues({
      state: "open",
      perPage: 100,
    });
    if (issuesResult.modified && issuesResult.data) {
      const issues = issuesResult.data.items.map(
        (item): CachedIssue => ({
          id: item.id,
          nodeId: item.nodeId,
          number: item.number,
          title: item.title,
          state: item.state,
          htmlUrl: item.htmlUrl,
          repositoryUrl: `https://api.github.com/repos/${item.repositoryFullName}`,
          repositoryFullName: item.repositoryFullName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          closedAt: item.closedAt,
          labels: item.labels,
          assignees: item.assignees,
          user: item.user,
          comments: item.comments,
          isPullRequest: item.isPullRequest,
        }),
      );
      entityCache.upsertIssues(issues, { etag: issuesResult.etag });
      console.log(`[Sync] Cached ${issues.length} issues`);
    }

    // Fetch PRs where user is requested for review
    const reviewRequestedResult = await searchReviewRequestedPRs({
      state: "open",
      perPage: 100,
    });
    if (reviewRequestedResult.modified && reviewRequestedResult.data) {
      const prs = reviewRequestedResult.data.items.map(
        (item): CachedPullRequest => ({
          id: item.id,
          nodeId: item.nodeId,
          number: item.number,
          title: item.title,
          state: item.state,
          htmlUrl: item.htmlUrl,
          repositoryFullName: item.repositoryFullName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          closedAt: item.closedAt,
          mergedAt: item.mergedAt,
          draft: item.draft,
          labels: item.labels,
          user: item.user,
          requestedReviewers: item.requestedReviewers,
          head: item.head,
          base: item.base,
        }),
      );
      entityCache.upsertPullRequests(prs, { etag: reviewRequestedResult.etag });
      console.log(`[Sync] Cached ${prs.length} PRs (review requested)`);
    }

    // Fetch PRs authored by user
    const authoredResult = await searchAuthoredPRs({
      state: "open",
      perPage: 100,
    });
    if (authoredResult.modified && authoredResult.data) {
      const prs = authoredResult.data.items.map(
        (item): CachedPullRequest => ({
          id: item.id,
          nodeId: item.nodeId,
          number: item.number,
          title: item.title,
          state: item.state,
          htmlUrl: item.htmlUrl,
          repositoryFullName: item.repositoryFullName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          closedAt: item.closedAt,
          mergedAt: item.mergedAt,
          draft: item.draft,
          labels: item.labels,
          user: item.user,
          requestedReviewers: item.requestedReviewers,
          head: item.head,
          base: item.base,
        }),
      );
      entityCache.upsertPullRequests(prs, { etag: authoredResult.etag });
      console.log(`[Sync] Cached ${prs.length} PRs (authored)`);
    }

    // Fetch PRs assigned to user
    const assignedResult = await searchAssignedPRs({
      state: "open",
      perPage: 100,
    });
    if (assignedResult.modified && assignedResult.data) {
      const prs = assignedResult.data.items.map(
        (item): CachedPullRequest => ({
          id: item.id,
          nodeId: item.nodeId,
          number: item.number,
          title: item.title,
          state: item.state,
          htmlUrl: item.htmlUrl,
          repositoryFullName: item.repositoryFullName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          closedAt: item.closedAt,
          mergedAt: item.mergedAt,
          draft: item.draft,
          labels: item.labels,
          user: item.user,
          requestedReviewers: item.requestedReviewers,
          head: item.head,
          base: item.base,
        }),
      );
      entityCache.upsertPullRequests(prs, { etag: assignedResult.etag });
      console.log(`[Sync] Cached ${prs.length} PRs (assigned)`);
    }
  }

  /**
   * Deferred Fetch
   * Fetches repositories from all sources
   */
  private deferredFetch(): void {
    const fetchQueue = useFetchQueue.getState();
    const entityCache = useEntityCache.getState();

    // Fetch repos owned by user
    fetchQueue.addJob({
      priority: FetchPriority.NORMAL,
      entityType: "repos",
      execute: async () => {
        const result = await fetchUserOwnedRepos({ perPage: 100 });
        if (result.modified && result.data) {
          entityCache.upsertRepos(result.data, { etag: result.etag });
          console.log(`[Sync] Cached ${result.data.length} owned repos`);
        }
      },
    });

    // Fetch repos where user is collaborator (private repos invited to)
    fetchQueue.addJob({
      priority: FetchPriority.NORMAL,
      entityType: "repos",
      execute: async () => {
        const result = await fetchUserCollaboratorRepos({ perPage: 100 });
        if (result.modified && result.data) {
          entityCache.upsertRepos(result.data, { etag: result.etag });
          console.log(`[Sync] Cached ${result.data.length} collaborator repos`);
        }
      },
    });

    // Fetch repos where user is member (org repos)
    fetchQueue.addJob({
      priority: FetchPriority.NORMAL,
      entityType: "repos",
      execute: async () => {
        const result = await fetchUserMemberRepos({ perPage: 100 });
        if (result.modified && result.data) {
          entityCache.upsertRepos(result.data, { etag: result.etag });
          console.log(`[Sync] Cached ${result.data.length} member repos`);
        }
      },
    });

    // Fetch repos from each org
    const orgs = Object.values(entityCache.orgs.byId);
    for (const org of orgs) {
      fetchQueue.addJob({
        priority: FetchPriority.LOW,
        entityType: "repos",
        execute: async () => {
          const result = await fetchOrgRepos(org.login, { perPage: 100 });
          if (result.modified && result.data) {
            entityCache.upsertRepos(result.data, { etag: result.etag });
            console.log(
              `[Sync] Cached ${result.data.length} repos for org ${org.login}`,
            );
          }
        },
      });
    }
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
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    const rateLimitStore = useRateLimitStore.getState();
    if (rateLimitStore.isRateLimited()) {
      console.log("[Sync] Skipping background sync - rate limited");
      return;
    }

    const entityCache = useEntityCache.getState();
    const fetchQueue = useFetchQueue.getState();

    // Refresh issues
    fetchQueue.addJob({
      priority: FetchPriority.LOW,
      entityType: "issues",
      execute: async () => {
        const result = await searchUserIssues({ state: "open", perPage: 100 });
        if (result.modified && result.data) {
          const issues = result.data.items.map(
            (item): CachedIssue => ({
              id: item.id,
              nodeId: item.nodeId,
              number: item.number,
              title: item.title,
              state: item.state,
              htmlUrl: item.htmlUrl,
              repositoryUrl: `https://api.github.com/repos/${item.repositoryFullName}`,
              repositoryFullName: item.repositoryFullName,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              closedAt: item.closedAt,
              labels: item.labels,
              assignees: item.assignees,
              user: item.user,
              comments: item.comments,
              isPullRequest: item.isPullRequest,
            }),
          );
          entityCache.upsertIssues(issues, { etag: result.etag });
          entityCache.updateCursor("user", Date.now());
        }
      },
    });

    // Refresh PRs
    fetchQueue.addJob({
      priority: FetchPriority.LOW,
      entityType: "pullRequests",
      execute: async () => {
        const [reviewResult, authoredResult, assignedResult] =
          await Promise.allSettled([
            searchReviewRequestedPRs({ state: "open", perPage: 100 }),
            searchAuthoredPRs({ state: "open", perPage: 100 }),
            searchAssignedPRs({ state: "open", perPage: 100 }),
          ]);

        const allPRs: CachedPullRequest[] = [];

        for (const result of [reviewResult, authoredResult, assignedResult]) {
          if (
            result.status === "fulfilled" &&
            result.value.modified &&
            result.value.data
          ) {
            const prs = result.value.data.items.map(
              (item): CachedPullRequest => ({
                id: item.id,
                nodeId: item.nodeId,
                number: item.number,
                title: item.title,
                state: item.state,
                htmlUrl: item.htmlUrl,
                repositoryFullName: item.repositoryFullName,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                closedAt: item.closedAt,
                mergedAt: item.mergedAt,
                draft: item.draft,
                labels: item.labels,
                user: item.user,
                requestedReviewers: item.requestedReviewers,
                head: item.head,
                base: item.base,
              }),
            );
            allPRs.push(...prs);
          }
        }

        if (allPRs.length > 0) {
          entityCache.upsertPullRequests(allPRs);
          entityCache.updateCursor("user", Date.now());
        }
      },
    });
  }

  /**
   * Visibility Change Handler
   */
  private handleVisibilityChange = (): void => {
    if (typeof document === "undefined") return;

    if (!document.hidden) {
      const now = Date.now();
      if (now - lastVisibilityChange > 30000) {
        console.log("[Sync] Tab visible - revalidating");
        this.runBackgroundSync();
      }
      lastVisibilityChange = now;
    }
  };

  /**
   * Online Handler
   */
  private handleOnline = (): void => {
    console.log("[Sync] Network restored - resuming sync");
    useEntityCache.getState().setSyncStatus("idle");
    this.runBackgroundSync();
  };

  /**
   * Offline Handler
   */
  private handleOffline = (): void => {
    console.log("[Sync] Network lost - pausing sync");
    useEntityCache.getState().setSyncStatus("offline");
  };

  /**
   * Manual Refresh
   */
  async manualRefresh(): Promise<void> {
    const rateLimitStore = useRateLimitStore.getState();

    if (rateLimitStore.isRateLimited()) {
      const timeUntilReset = rateLimitStore.getTimeUntilReset();
      console.warn(
        `[Sync] Rate limited. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds`,
      );
      return;
    }

    console.log("[Sync] Manual refresh triggered");
    await this.priorityFetch();
    this.deferredFetch();
    useEntityCache.getState().updateLastSync();
  }

  /**
   * Fetch Workflow Runs for Pinned Repos
   */
  async fetchWorkflowsForPinnedRepos(
    pinnedRepos: Array<{ owner: string; name: string; fullName: string }>,
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
              entityCache.upsertWorkflowRuns(result.data, {
                etag: result.etag,
              });
              entityCache.updateRepoCursor(
                repo.fullName,
                "workflows",
                Date.now(),
              );
            }
          } catch (error) {
            console.log(
              `[Sync] Could not fetch workflows for ${repo.fullName}`,
            );
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

  const refresh = useCallback(async () => {
    const orchestrator = getSyncOrchestrator();
    await orchestrator.manualRefresh();
  }, []);

  const fetchWorkflowsForPinned = useCallback(
    async (repos: Array<{ owner: string; name: string; fullName: string }>) => {
      const orchestrator = getSyncOrchestrator();
      await orchestrator.fetchWorkflowsForPinnedRepos(repos);
    },
    [],
  );

  const syncStatus = entityCache.syncState.status;
  const lastSyncAt = entityCache.syncState.lastSyncAt;
  const isDegraded = entityCache.syncState.isDegraded;
  const isRateLimited = rateLimitStore.isRateLimited();
  const rateLimitRemaining = rateLimitStore.rateLimit.remaining;

  return {
    syncStatus,
    lastSyncAt,
    isDegraded,
    isRateLimited,
    rateLimitRemaining,
    refresh,
    fetchWorkflowsForPinned,
    repos: entityCache.repos,
    issues: entityCache.issues,
    pullRequests: entityCache.pullRequests,
    workflowRuns: entityCache.workflowRuns,
    orgs: entityCache.orgs,
    getOpenIssues: entityCache.getOpenIssues,
    getOpenPRs: entityCache.getOpenPRs,
  };
}
