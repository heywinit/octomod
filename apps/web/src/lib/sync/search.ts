/**
 * Search Module
 * Hybrid search: cache first, then GitHub API
 */

import { db } from "./database";
import { searchIssues, searchRepos } from "./github-api";
import type {
  CachedSearchResult,
  SearchResultIssue,
  SearchResultPR,
  SearchResultRepo,
} from "./types";

const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface SearchOptions {
  type: "repos" | "issues" | "prs";
  query: string;
  perPage?: number;
  forceRefresh?: boolean;
}

interface SearchResult<T> {
  items: T[];
  totalCount: number;
  fromCache: boolean;
  etag?: string;
}

function getSearchCacheKey(query: string, type: string): string {
  return `${type}:${query.toLowerCase()}`;
}

export async function search<
  T extends SearchResultIssue | SearchResultPR | SearchResultRepo,
>(options: SearchOptions): Promise<SearchResult<T>> {
  const { type, query, perPage = 30, forceRefresh = false } = options;

  const cacheKey = getSearchCacheKey(query, type);
  const now = Date.now();

  // Try to get from cache first
  if (!forceRefresh) {
    const cached = await db.searchResults.get(cacheKey);

    if (cached && cached.query === query && cached.type === type) {
      const age = now - cached.fetchedAt;

      // Return cached if fresh enough
      if (age < SEARCH_CACHE_TTL) {
        return {
          items: cached.items as T[],
          totalCount: cached.totalCount,
          fromCache: true,
          etag: cached.etag,
        };
      }
    }
  }

  // Fetch from GitHub API
  try {
    let result: {
      modified: boolean;
      data?: { items: any[]; totalCount: number };
      etag?: string;
    };

    if (type === "repos") {
      result = await searchRepos(query, { perPage });
    } else if (type === "issues" || type === "prs") {
      const searchType = type === "prs" ? "is:pr" : "is:issue";
      result = await searchIssues(`${searchType} ${query}`, { perPage });
    } else {
      throw new Error(`Unknown search type: ${type}`);
    }

    if (result.modified && result.data) {
      const cachedResult: CachedSearchResult = {
        id: cacheKey,
        query,
        type,
        items: result.data.items,
        totalCount: result.data.totalCount,
        fetchedAt: now,
        etag: result.etag,
      };

      // Store in cache
      await db.searchResults.put(cachedResult);

      return {
        items: result.data.items as T[],
        totalCount: result.data.totalCount,
        fromCache: false,
        etag: result.etag,
      };
    }

    // If not modified (304), try to return cached data
    const cached = await db.searchResults.get(cacheKey);
    if (cached) {
      return {
        items: cached.items as T[],
        totalCount: cached.totalCount,
        fromCache: true,
        etag: cached.etag,
      };
    }

    throw new Error("No data available");
  } catch (error) {
    console.error(`[Search] Failed to search ${type}:`, error);

    // Fall back to cache even if stale
    const cached = await db.searchResults.get(cacheKey);
    if (cached) {
      return {
        items: cached.items as T[],
        totalCount: cached.totalCount,
        fromCache: true,
        etag: cached.etag,
      };
    }

    throw error;
  }
}

/**
 * Search repositories
 */
export async function searchRepositories(
  query: string,
  options?: { perPage?: number; forceRefresh?: boolean },
): Promise<SearchResult<SearchResultRepo>> {
  return search<SearchResultRepo>({
    type: "repos",
    query,
    ...options,
  });
}

/**
 * Search issues
 */
export async function searchAllIssues(
  query: string,
  options?: { perPage?: number; forceRefresh?: boolean },
): Promise<SearchResult<SearchResultIssue>> {
  return search<SearchResultIssue>({
    type: "issues",
    query,
    ...options,
  });
}

/**
 * Search PRs
 */
export async function searchAllPRs(
  query: string,
  options?: { perPage?: number; forceRefresh?: boolean },
): Promise<SearchResult<SearchResultPR>> {
  return search<SearchResultPR>({
    type: "prs",
    query,
    ...options,
  });
}

/**
 * Clear old search cache entries
 */
export async function clearSearchCache(): Promise<void> {
  const cutoff = Date.now() - SEARCH_CACHE_TTL;
  const oldEntries = await db.searchResults
    .filter((entry) => entry.fetchedAt < cutoff)
    .primaryKeys();

  await db.searchResults.bulkDelete(oldEntries);
}
