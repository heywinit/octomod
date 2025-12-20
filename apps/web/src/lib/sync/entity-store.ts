/**
 * Entity Cache Store
 * Central store for all cached GitHub entities with sync metadata
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  EntityState,
  SyncMeta,
  SyncCursors,
  SyncState,
  CachedRepo,
  CachedIssue,
  CachedPullRequest,
  CachedWorkflowRun,
  CachedOrg,
} from "./types";

// =============================================================================
// Helper to create empty entity state
// =============================================================================

function createEmptyEntityState<T>(): EntityState<T> {
  return {
    byId: {},
    meta: {},
    allIds: [],
  };
}

// =============================================================================
// Store Interface
// =============================================================================

interface EntityCacheStore {
  // Entity caches
  repos: EntityState<CachedRepo>;
  issues: EntityState<CachedIssue>;
  pullRequests: EntityState<CachedPullRequest>;
  workflowRuns: EntityState<CachedWorkflowRun>;
  orgs: EntityState<CachedOrg>;

  // Sync metadata
  cursors: SyncCursors;
  syncState: SyncState;

  // Actions - Entity operations
  upsertRepo: (repo: CachedRepo, meta?: Partial<SyncMeta>) => void;
  upsertRepos: (repos: CachedRepo[], meta?: Partial<SyncMeta>) => void;
  upsertIssue: (issue: CachedIssue, meta?: Partial<SyncMeta>) => void;
  upsertIssues: (issues: CachedIssue[], meta?: Partial<SyncMeta>) => void;
  upsertPullRequest: (pr: CachedPullRequest, meta?: Partial<SyncMeta>) => void;
  upsertPullRequests: (prs: CachedPullRequest[], meta?: Partial<SyncMeta>) => void;
  upsertWorkflowRun: (run: CachedWorkflowRun, meta?: Partial<SyncMeta>) => void;
  upsertWorkflowRuns: (runs: CachedWorkflowRun[], meta?: Partial<SyncMeta>) => void;
  upsertOrg: (org: CachedOrg, meta?: Partial<SyncMeta>) => void;
  upsertOrgs: (orgs: CachedOrg[], meta?: Partial<SyncMeta>) => void;

  // Actions - Meta operations
  updateMeta: (
    entityType: "repos" | "issues" | "pullRequests" | "workflowRuns" | "orgs",
    entityId: string,
    meta: Partial<SyncMeta>
  ) => void;
  getMeta: (
    entityType: "repos" | "issues" | "pullRequests" | "workflowRuns" | "orgs",
    entityId: string
  ) => SyncMeta | undefined;

  // Actions - Cursor operations
  updateCursor: (
    type: "user",
    value: number
  ) => void;
  updateOrgCursor: (orgLogin: string, value: number) => void;
  updateRepoCursor: (
    repoFullName: string,
    cursorType: "issues" | "prs" | "workflows",
    value: number
  ) => void;

  // Actions - Sync state
  setSyncStatus: (status: SyncState["status"], error?: string) => void;
  setDegraded: (isDegraded: boolean) => void;
  updateLastSync: () => void;

  // Actions - Queries
  getReposByIds: (ids: string[]) => CachedRepo[];
  getIssuesByRepo: (repoFullName: string) => CachedIssue[];
  getPRsByRepo: (repoFullName: string) => CachedPullRequest[];
  getOpenIssues: () => CachedIssue[];
  getOpenPRs: () => CachedPullRequest[];

  // Actions - Cache management
  clearAll: () => void;
  clearStaleData: (staleThreshold: number) => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useEntityCache = create<EntityCacheStore>()(
  persist(
    (set, get) => ({
      // Initial state
      repos: createEmptyEntityState<CachedRepo>(),
      issues: createEmptyEntityState<CachedIssue>(),
      pullRequests: createEmptyEntityState<CachedPullRequest>(),
      workflowRuns: createEmptyEntityState<CachedWorkflowRun>(),
      orgs: createEmptyEntityState<CachedOrg>(),

      cursors: {
        orgs: {},
        repos: {},
      },

      syncState: {
        status: "idle",
        isDegraded: false,
        pendingJobs: 0,
      },

      // =======================================================================
      // Entity Upsert Operations
      // =======================================================================

      upsertRepo: (repo, meta) => {
        set((state) => {
          const id = String(repo.id);
          const existingMeta = state.repos.meta[id] || {};
          const newMeta: SyncMeta = {
            ...existingMeta,
            ...meta,
            lastFetchedAt: Date.now(),
            githubUpdatedAt: repo.updatedAt,
          };

          return {
            repos: {
              byId: { ...state.repos.byId, [id]: repo },
              meta: { ...state.repos.meta, [id]: newMeta },
              allIds: state.repos.allIds.includes(id)
                ? state.repos.allIds
                : [...state.repos.allIds, id],
            },
          };
        });
      },

      upsertRepos: (repos, meta) => {
        set((state) => {
          const newById = { ...state.repos.byId };
          const newMeta = { ...state.repos.meta };
          const newAllIds = [...state.repos.allIds];

          for (const repo of repos) {
            const id = String(repo.id);
            newById[id] = repo;
            newMeta[id] = {
              ...(newMeta[id] || {}),
              ...meta,
              lastFetchedAt: Date.now(),
              githubUpdatedAt: repo.updatedAt,
            };
            if (!newAllIds.includes(id)) {
              newAllIds.push(id);
            }
          }

          return {
            repos: { byId: newById, meta: newMeta, allIds: newAllIds },
          };
        });
      },

      upsertIssue: (issue, meta) => {
        set((state) => {
          const id = String(issue.id);
          const existingMeta = state.issues.meta[id] || {};
          const newMeta: SyncMeta = {
            ...existingMeta,
            ...meta,
            lastFetchedAt: Date.now(),
            githubUpdatedAt: issue.updatedAt,
          };

          return {
            issues: {
              byId: { ...state.issues.byId, [id]: issue },
              meta: { ...state.issues.meta, [id]: newMeta },
              allIds: state.issues.allIds.includes(id)
                ? state.issues.allIds
                : [...state.issues.allIds, id],
            },
          };
        });
      },

      upsertIssues: (issues, meta) => {
        set((state) => {
          const newById = { ...state.issues.byId };
          const newMeta = { ...state.issues.meta };
          const newAllIds = [...state.issues.allIds];

          for (const issue of issues) {
            const id = String(issue.id);
            newById[id] = issue;
            newMeta[id] = {
              ...(newMeta[id] || {}),
              ...meta,
              lastFetchedAt: Date.now(),
              githubUpdatedAt: issue.updatedAt,
            };
            if (!newAllIds.includes(id)) {
              newAllIds.push(id);
            }
          }

          return {
            issues: { byId: newById, meta: newMeta, allIds: newAllIds },
          };
        });
      },

      upsertPullRequest: (pr, meta) => {
        set((state) => {
          const id = String(pr.id);
          const existingMeta = state.pullRequests.meta[id] || {};
          const newMeta: SyncMeta = {
            ...existingMeta,
            ...meta,
            lastFetchedAt: Date.now(),
            githubUpdatedAt: pr.updatedAt,
          };

          return {
            pullRequests: {
              byId: { ...state.pullRequests.byId, [id]: pr },
              meta: { ...state.pullRequests.meta, [id]: newMeta },
              allIds: state.pullRequests.allIds.includes(id)
                ? state.pullRequests.allIds
                : [...state.pullRequests.allIds, id],
            },
          };
        });
      },

      upsertPullRequests: (prs, meta) => {
        set((state) => {
          const newById = { ...state.pullRequests.byId };
          const newMeta = { ...state.pullRequests.meta };
          const newAllIds = [...state.pullRequests.allIds];

          for (const pr of prs) {
            const id = String(pr.id);
            newById[id] = pr;
            newMeta[id] = {
              ...(newMeta[id] || {}),
              ...meta,
              lastFetchedAt: Date.now(),
              githubUpdatedAt: pr.updatedAt,
            };
            if (!newAllIds.includes(id)) {
              newAllIds.push(id);
            }
          }

          return {
            pullRequests: { byId: newById, meta: newMeta, allIds: newAllIds },
          };
        });
      },

      upsertWorkflowRun: (run, meta) => {
        set((state) => {
          const id = String(run.id);
          const existingMeta = state.workflowRuns.meta[id] || {};
          const newMeta: SyncMeta = {
            ...existingMeta,
            ...meta,
            lastFetchedAt: Date.now(),
            githubUpdatedAt: run.updatedAt,
          };

          return {
            workflowRuns: {
              byId: { ...state.workflowRuns.byId, [id]: run },
              meta: { ...state.workflowRuns.meta, [id]: newMeta },
              allIds: state.workflowRuns.allIds.includes(id)
                ? state.workflowRuns.allIds
                : [...state.workflowRuns.allIds, id],
            },
          };
        });
      },

      upsertWorkflowRuns: (runs, meta) => {
        set((state) => {
          const newById = { ...state.workflowRuns.byId };
          const newMeta = { ...state.workflowRuns.meta };
          const newAllIds = [...state.workflowRuns.allIds];

          for (const run of runs) {
            const id = String(run.id);
            newById[id] = run;
            newMeta[id] = {
              ...(newMeta[id] || {}),
              ...meta,
              lastFetchedAt: Date.now(),
              githubUpdatedAt: run.updatedAt,
            };
            if (!newAllIds.includes(id)) {
              newAllIds.push(id);
            }
          }

          return {
            workflowRuns: { byId: newById, meta: newMeta, allIds: newAllIds },
          };
        });
      },

      upsertOrg: (org, meta) => {
        set((state) => {
          const id = String(org.id);
          const existingMeta = state.orgs.meta[id] || {};
          const newMeta: SyncMeta = {
            ...existingMeta,
            ...meta,
            lastFetchedAt: Date.now(),
          };

          return {
            orgs: {
              byId: { ...state.orgs.byId, [id]: org },
              meta: { ...state.orgs.meta, [id]: newMeta },
              allIds: state.orgs.allIds.includes(id)
                ? state.orgs.allIds
                : [...state.orgs.allIds, id],
            },
          };
        });
      },

      upsertOrgs: (orgs, meta) => {
        set((state) => {
          const newById = { ...state.orgs.byId };
          const newMeta = { ...state.orgs.meta };
          const newAllIds = [...state.orgs.allIds];

          for (const org of orgs) {
            const id = String(org.id);
            newById[id] = org;
            newMeta[id] = {
              ...(newMeta[id] || {}),
              ...meta,
              lastFetchedAt: Date.now(),
            };
            if (!newAllIds.includes(id)) {
              newAllIds.push(id);
            }
          }

          return {
            orgs: { byId: newById, meta: newMeta, allIds: newAllIds },
          };
        });
      },

      // =======================================================================
      // Meta Operations
      // =======================================================================

      updateMeta: (entityType, entityId, meta) => {
        set((state) => ({
          [entityType]: {
            ...state[entityType],
            meta: {
              ...state[entityType].meta,
              [entityId]: {
                ...(state[entityType].meta[entityId] || {}),
                ...meta,
              },
            },
          },
        }));
      },

      getMeta: (entityType, entityId) => {
        return get()[entityType].meta[entityId];
      },

      // =======================================================================
      // Cursor Operations
      // =======================================================================

      updateCursor: (type, value) => {
        set((state) => ({
          cursors: {
            ...state.cursors,
            [type]: value,
          },
        }));
      },

      updateOrgCursor: (orgLogin, value) => {
        set((state) => ({
          cursors: {
            ...state.cursors,
            orgs: {
              ...state.cursors.orgs,
              [orgLogin]: value,
            },
          },
        }));
      },

      updateRepoCursor: (repoFullName, cursorType, value) => {
        set((state) => ({
          cursors: {
            ...state.cursors,
            repos: {
              ...state.cursors.repos,
              [repoFullName]: {
                ...(state.cursors.repos[repoFullName] || {}),
                [cursorType]: value,
              },
            },
          },
        }));
      },

      // =======================================================================
      // Sync State Operations
      // =======================================================================

      setSyncStatus: (status, error) => {
        set((state) => ({
          syncState: {
            ...state.syncState,
            status,
            error,
          },
        }));
      },

      setDegraded: (isDegraded) => {
        set((state) => ({
          syncState: {
            ...state.syncState,
            isDegraded,
          },
        }));
      },

      updateLastSync: () => {
        set((state) => ({
          syncState: {
            ...state.syncState,
            lastSyncAt: Date.now(),
          },
        }));
      },

      // =======================================================================
      // Query Operations
      // =======================================================================

      getReposByIds: (ids) => {
        const { repos } = get();
        return ids.map((id) => repos.byId[id]).filter(Boolean);
      },

      getIssuesByRepo: (repoFullName) => {
        const { issues } = get();
        return Object.values(issues.byId).filter(
          (issue) => issue.repositoryFullName === repoFullName
        );
      },

      getPRsByRepo: (repoFullName) => {
        const { pullRequests } = get();
        return Object.values(pullRequests.byId).filter(
          (pr) => pr.repositoryFullName === repoFullName
        );
      },

      getOpenIssues: () => {
        const { issues } = get();
        return Object.values(issues.byId)
          .filter((issue) => issue.state === "open" && !issue.isPullRequest)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      },

      getOpenPRs: () => {
        const { pullRequests } = get();
        return Object.values(pullRequests.byId)
          .filter((pr) => pr.state === "open")
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      },

      // =======================================================================
      // Cache Management
      // =======================================================================

      clearAll: () => {
        set({
          repos: createEmptyEntityState<CachedRepo>(),
          issues: createEmptyEntityState<CachedIssue>(),
          pullRequests: createEmptyEntityState<CachedPullRequest>(),
          workflowRuns: createEmptyEntityState<CachedWorkflowRun>(),
          orgs: createEmptyEntityState<CachedOrg>(),
          cursors: { orgs: {}, repos: {} },
          syncState: {
            status: "idle",
            isDegraded: false,
            pendingJobs: 0,
          },
        });
      },

      clearStaleData: (staleThreshold) => {
        const now = Date.now();
        const isStale = (meta: SyncMeta | undefined) =>
          !meta?.lastFetchedAt || now - meta.lastFetchedAt > staleThreshold;

        set((state) => {
          // Helper to filter stale entities
          const filterEntity = <T>(entityState: EntityState<T>): EntityState<T> => {
            const freshIds = entityState.allIds.filter(
              (id) => !isStale(entityState.meta[id])
            );
            return {
              byId: Object.fromEntries(
                freshIds.map((id) => [id, entityState.byId[id]])
              ),
              meta: Object.fromEntries(
                freshIds.map((id) => [id, entityState.meta[id]])
              ),
              allIds: freshIds,
            };
          };

          return {
            repos: filterEntity(state.repos),
            issues: filterEntity(state.issues),
            pullRequests: filterEntity(state.pullRequests),
            workflowRuns: filterEntity(state.workflowRuns),
            orgs: filterEntity(state.orgs),
          };
        });
      },
    }),
    {
      name: "octomod-entity-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        repos: state.repos,
        issues: state.issues,
        pullRequests: state.pullRequests,
        workflowRuns: state.workflowRuns,
        orgs: state.orgs,
        cursors: state.cursors,
        syncState: {
          lastSyncAt: state.syncState.lastSyncAt,
          isDegraded: false,
          status: "idle" as const,
          pendingJobs: 0,
        },
      }),
    }
  )
);

