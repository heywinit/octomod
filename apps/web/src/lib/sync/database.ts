/**
 * Dexie Database Schema
 * IndexedDB wrapper for persistent storage
 */

import Dexie, { type Table } from "dexie";
import type {
  CachedIssue,
  CachedOrg,
  CachedPullRequest,
  CachedRepo,
  CachedSearchResult,
  CachedWorkflowRun,
} from "./types";

export interface DBSyncMeta {
  id: string;
  etag?: string;
  lastFetchedAt?: number;
  githubUpdatedAt?: string;
}

export interface DBRepo extends CachedRepo {}
export interface DBIssue extends CachedIssue {}
export interface DBPR extends CachedPullRequest {}
export interface DBWorkflowRun extends CachedWorkflowRun {}
export interface DBOrg extends CachedOrg {}
export interface DBSearchResult extends CachedSearchResult {}

class OctomodDatabase extends Dexie {
  repos!: Table<DBRepo, number>;
  issues!: Table<DBIssue, number>;
  pullRequests!: Table<DBPR, number>;
  workflowRuns!: Table<DBWorkflowRun, number>;
  orgs!: Table<DBOrg, number>;
  searchResults!: Table<DBSearchResult, string>;
  syncMeta!: Table<DBSyncMeta, string>;

  constructor() {
    super("octomod");

    this.version(1).stores({
      repos: "id, fullName, owner.login, updatedAt, visibility",
      issues:
        "id, repositoryFullName, state, updatedAt, [repositoryFullName+state]",
      pullRequests:
        "id, repositoryFullName, state, updatedAt, [repositoryFullName+state]",
      workflowRuns: "id, repositoryFullName, status, updatedAt",
      orgs: "id, login",
      searchResults: "id, query, type, fetchedAt",
      syncMeta: "id",
    });
  }
}

export const db = new OctomodDatabase();

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.repos.clear(),
    db.issues.clear(),
    db.pullRequests.clear(),
    db.workflowRuns.clear(),
    db.orgs.clear(),
    db.searchResults.clear(),
    db.syncMeta.clear(),
  ]);
}

export async function getSyncMeta(
  entityType: string,
): Promise<DBSyncMeta | undefined> {
  return db.syncMeta.get(entityType);
}

export async function setSyncMeta(
  entityType: string,
  meta: Partial<DBSyncMeta>,
): Promise<void> {
  await db.syncMeta.put({ id: entityType, ...meta });
}
