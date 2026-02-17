/**
 * Entity Cache Store
 * Central store for all cached GitHub entities with Dexie persistence
 */

import { create } from "zustand";
import { db } from "./database";
import type {
  CachedIssue,
  CachedOrg,
  CachedPullRequest,
  CachedRepo,
  CachedSearchResult,
  CachedWorkflowRun,
  EntityState,
  SyncCursors,
  SyncMeta,
  SyncState,
} from "./types";

function createEmptyEntityState<T>(): EntityState<T> {
  return {
    byId: {},
    meta: {},
    allIds: [],
  };
}

interface EntityCacheStore {
  repos: EntityState<CachedRepo>;
  issues: EntityState<CachedIssue>;
  pullRequests: EntityState<CachedPullRequest>;
  workflowRuns: EntityState<CachedWorkflowRun>;
  orgs: EntityState<CachedOrg>;
  searchResults: Record<string, CachedSearchResult>;

  cursors: SyncCursors;
  syncState: SyncState;

  upsertRepo: (repo: CachedRepo, meta?: Partial<SyncMeta>) => Promise<void>;
  upsertRepos: (repos: CachedRepo[], meta?: Partial<SyncMeta>) => Promise<void>;
  upsertIssue: (issue: CachedIssue, meta?: Partial<SyncMeta>) => Promise<void>;
  upsertIssues: (
    issues: CachedIssue[],
    meta?: Partial<SyncMeta>,
  ) => Promise<void>;
  upsertPullRequest: (
    pr: CachedPullRequest,
    meta?: Partial<SyncMeta>,
  ) => Promise<void>;
  upsertPullRequests: (
    prs: CachedPullRequest[],
    meta?: Partial<SyncMeta>,
  ) => Promise<void>;
  upsertWorkflowRun: (
    run: CachedWorkflowRun,
    meta?: Partial<SyncMeta>,
  ) => Promise<void>;
  upsertWorkflowRuns: (
    runs: CachedWorkflowRun[],
    meta?: Partial<SyncMeta>,
  ) => Promise<void>;
  upsertOrg: (org: CachedOrg, meta?: Partial<SyncMeta>) => Promise<void>;
  upsertOrgs: (orgs: CachedOrg[], meta?: Partial<SyncMeta>) => Promise<void>;
  upsertSearchResult: (result: CachedSearchResult) => Promise<void>;

  loadFromDatabase: () => Promise<void>;

  updateCursor: (type: "user", value: number) => void;
  updateOrgCursor: (orgLogin: string, value: number) => void;
  updateRepoCursor: (
    repoFullName: string,
    cursorType: "issues" | "prs" | "workflows",
    value: number,
  ) => void;

  setSyncStatus: (status: SyncState["status"], error?: string) => void;
  setDegraded: (isDegraded: boolean) => void;
  updateLastSync: () => void;

  getReposByIds: (ids: string[]) => CachedRepo[];
  getIssuesByRepo: (repoFullName: string) => CachedIssue[];
  getPRsByRepo: (repoFullName: string) => CachedPullRequest[];
  getOpenIssues: () => CachedIssue[];
  getOpenPRs: () => CachedPullRequest[];

  clearAll: () => Promise<void>;
}

export const useEntityCache = create<EntityCacheStore>()((set, get) => ({
  repos: createEmptyEntityState<CachedRepo>(),
  issues: createEmptyEntityState<CachedIssue>(),
  pullRequests: createEmptyEntityState<CachedPullRequest>(),
  workflowRuns: createEmptyEntityState<CachedWorkflowRun>(),
  orgs: createEmptyEntityState<CachedOrg>(),
  searchResults: {},

  cursors: {
    orgs: {},
    repos: {},
  },

  syncState: {
    status: "idle",
    isDegraded: false,
    pendingJobs: 0,
  },

  loadFromDatabase: async () => {
    const [repos, issues, prs, workflows, orgs] = await Promise.all([
      db.repos.toArray(),
      db.issues.toArray(),
      db.pullRequests.toArray(),
      db.workflowRuns.toArray(),
      db.orgs.toArray(),
    ]);

    const reposState = createEmptyEntityState<CachedRepo>();
    for (const repo of repos) {
      const id = String(repo.id);
      reposState.byId[id] = repo;
      reposState.allIds.push(id);
    }

    const issuesState = createEmptyEntityState<CachedIssue>();
    for (const issue of issues) {
      const id = String(issue.id);
      issuesState.byId[id] = issue;
      issuesState.allIds.push(id);
    }

    const prsState = createEmptyEntityState<CachedPullRequest>();
    for (const pr of prs) {
      const id = String(pr.id);
      prsState.byId[id] = pr;
      prsState.allIds.push(id);
    }

    const workflowsState = createEmptyEntityState<CachedWorkflowRun>();
    for (const run of workflows) {
      const id = String(run.id);
      workflowsState.byId[id] = run;
      workflowsState.allIds.push(id);
    }

    const orgsState = createEmptyEntityState<CachedOrg>();
    for (const org of orgs) {
      const id = String(org.id);
      orgsState.byId[id] = org;
      orgsState.allIds.push(id);
    }

    set({
      repos: reposState,
      issues: issuesState,
      pullRequests: prsState,
      workflowRuns: workflowsState,
      orgs: orgsState,
    });
  },

  upsertRepo: async (repo, meta) => {
    const id = repo.id;
    await db.repos.put(repo);

    set((state) => {
      const existingMeta = state.repos.meta[String(id)] || {};
      const newMeta: SyncMeta = {
        ...existingMeta,
        ...meta,
        lastFetchedAt: Date.now(),
        githubUpdatedAt: repo.updatedAt,
      };

      return {
        repos: {
          byId: { ...state.repos.byId, [String(id)]: repo },
          meta: { ...state.repos.meta, [String(id)]: newMeta },
          allIds: state.repos.allIds.includes(String(id))
            ? state.repos.allIds
            : [...state.repos.allIds, String(id)],
        },
      };
    });
  },

  upsertRepos: async (repos, meta) => {
    await db.repos.bulkPut(repos);

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

  upsertIssue: async (issue, meta) => {
    await db.issues.put(issue);

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

  upsertIssues: async (issues, meta) => {
    await db.issues.bulkPut(issues);

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

  upsertPullRequest: async (pr, meta) => {
    await db.pullRequests.put(pr);

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

  upsertPullRequests: async (prs, meta) => {
    await db.pullRequests.bulkPut(prs);

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

  upsertWorkflowRun: async (run, meta) => {
    await db.workflowRuns.put(run);

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

  upsertWorkflowRuns: async (runs, meta) => {
    await db.workflowRuns.bulkPut(runs);

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

  upsertOrg: async (org, meta) => {
    await db.orgs.put(org);

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

  upsertOrgs: async (orgs, meta) => {
    await db.orgs.bulkPut(orgs);

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

  upsertSearchResult: async (result) => {
    await db.searchResults.put(result);

    set((state) => ({
      searchResults: {
        ...state.searchResults,
        [result.id]: result,
      },
    }));
  },

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

  getReposByIds: (ids) => {
    const { repos } = get();
    return ids.map((id) => repos.byId[id]).filter(Boolean);
  },

  getIssuesByRepo: (repoFullName) => {
    const { issues } = get();
    return Object.values(issues.byId).filter(
      (issue) => issue.repositoryFullName === repoFullName,
    );
  },

  getPRsByRepo: (repoFullName) => {
    const { pullRequests } = get();
    return Object.values(pullRequests.byId).filter(
      (pr) => pr.repositoryFullName === repoFullName,
    );
  },

  getOpenIssues: () => {
    const { issues } = get();
    return Object.values(issues.byId)
      .filter((issue) => issue.state === "open" && !issue.isPullRequest)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  },

  getOpenPRs: () => {
    const { pullRequests } = get();
    return Object.values(pullRequests.byId)
      .filter((pr) => pr.state === "open")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  },

  clearAll: async () => {
    await db.delete();
    window.location.reload();
  },
}));
