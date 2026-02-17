import { useMemo } from "react";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { useEntityCache } from "@/lib/sync/entity-store";
import { useAuthStore } from "@/stores/auth";
import { usePinnedRepos } from "@/stores/pinned-repos";
import {
  matchesSearch,
  type ParsedQuery,
  QUICK_COMMANDS,
  type SearchOptions,
  type SearchResult,
  type SearchSection,
} from "./types";

function searchRepos(
  repos: Record<string, any>,
  query: ParsedQuery,
  limit: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const repo of Object.values(repos)) {
    const matchesTitle = matchesSearch(repo.fullName, query.searchTerms);
    const matchesDesc = repo.description
      ? matchesSearch(repo.description, query.searchTerms)
      : false;
    const matchesLang = query.filters.language
      ? repo.language?.toLowerCase() === query.filters.language.toLowerCase()
      : true;

    if ((matchesTitle || matchesDesc) && matchesLang) {
      results.push({
        id: `repo-${repo.id}`,
        type: "repo",
        title: repo.name,
        description: repo.description || `${repo.owner.login}/${repo.name}`,
        url: `/${repo.owner.login}/${repo.name}`,
        repo: repo.fullName,
        timeAgo: formatTimeAgo(new Date(repo.updatedAt)),
      });
    }
  }

  return results
    .sort((a, b) => (b.timeAgo || "").localeCompare(a.timeAgo || ""))
    .slice(0, limit);
}

function searchIssues(
  issues: Record<string, any>,
  query: ParsedQuery,
  currentUser: string | null,
  limit: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const issue of Object.values(issues)) {
    if (issue.isPullRequest) continue;

    const matchesTitle = matchesSearch(issue.title, query.searchTerms);
    const matchesNumber = query.searchTerms.some(
      (t) => t === String(issue.number),
    );

    if (!matchesTitle && !matchesNumber) continue;

    if (query.filters.isOpen && issue.state !== "open") continue;
    if (query.filters.isClosed && issue.state !== "closed") continue;
    if (query.filters.isAssigned) {
      const isAssigned = issue.assignees.some(
        (a: any) => a.login === currentUser,
      );
      if (!isAssigned) continue;
    }
    if (query.filters.label) {
      const hasLabel = issue.labels.some((l: any) =>
        l.name.toLowerCase().includes(query.filters.label!.toLowerCase()),
      );
      if (!hasLabel) continue;
    }

    results.push({
      id: `issue-${issue.id}`,
      type: "issue",
      title: issue.title,
      description: `${issue.repositoryFullName} #${issue.number}`,
      url: issue.htmlUrl,
      repo: issue.repositoryFullName,
      number: issue.number,
      labels: issue.labels,
      state: issue.state,
      isAssignedToYou: issue.assignees.some(
        (a: any) => a.login === currentUser,
      ),
      timeAgo: formatTimeAgo(new Date(issue.updatedAt)),
    });
  }

  return results
    .sort((a, b) => {
      if (a.isAssignedToYou && !b.isAssignedToYou) return -1;
      if (!a.isAssignedToYou && b.isAssignedToYou) return 1;
      return 0;
    })
    .slice(0, limit);
}

function searchPullRequests(
  prs: Record<string, any>,
  query: ParsedQuery,
  currentUser: string | null,
  limit: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const pr of Object.values(prs)) {
    const matchesTitle = matchesSearch(pr.title, query.searchTerms);
    const matchesNumber = query.searchTerms.some(
      (t) => t === String(pr.number),
    );

    if (!matchesTitle && !matchesNumber) continue;

    if (query.filters.isOpen && pr.state !== "open") continue;
    if (query.filters.isClosed && pr.state !== "closed" && !pr.mergedAt)
      continue;
    if (query.filters.isDraft && !pr.draft) continue;
    if (!query.filters.isDraft && pr.draft) continue;
    if (query.filters.isReviewRequested) {
      const isRequested = pr.requestedReviewers.some(
        (r: any) => r.login === currentUser,
      );
      if (!isRequested) continue;
    }
    if (query.filters.isAuthor) {
      if (pr.user.login !== currentUser) continue;
    }
    if (query.filters.label) {
      const hasLabel = pr.labels.some((l: any) =>
        l.name.toLowerCase().includes(query.filters.label!.toLowerCase()),
      );
      if (!hasLabel) continue;
    }

    results.push({
      id: `pr-${pr.id}`,
      type: "pullRequest",
      title: pr.title,
      description: `${pr.repositoryFullName} #${pr.number}`,
      url: pr.htmlUrl,
      repo: pr.repositoryFullName,
      number: pr.number,
      labels: pr.labels,
      state: pr.mergedAt ? "merged" : pr.state,
      isDraft: pr.draft,
      isReviewRequested: pr.requestedReviewers.some(
        (r: any) => r.login === currentUser,
      ),
      timeAgo: formatTimeAgo(new Date(pr.updatedAt)),
    });
  }

  return results
    .sort((a, b) => {
      if (a.isReviewRequested && !b.isReviewRequested) return -1;
      if (!a.isReviewRequested && b.isReviewRequested) return 1;
      return 0;
    })
    .slice(0, limit);
}

function searchOrgs(
  orgs: Record<string, any>,
  query: ParsedQuery,
  limit: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const org of Object.values(orgs)) {
    const matchesLogin = matchesSearch(org.login, query.searchTerms);
    const matchesDesc = org.description
      ? matchesSearch(org.description, query.searchTerms)
      : false;

    if (matchesLogin || matchesDesc) {
      results.push({
        id: `org-${org.id}`,
        type: "org",
        title: org.login,
        description: org.description || org.login,
        url: `/${org.login}`,
      });
    }
  }

  return results.slice(0, limit);
}

export function useLocalSearch(
  query: ParsedQuery,
  options: SearchOptions = {},
) {
  const { limit = 10, includeCommands = true } = options;
  const { repos, issues, pullRequests, orgs } = useEntityCache();
  const user = useAuthStore((state) => state.user);
  const { pinnedRepos } = usePinnedRepos();

  return useMemo(() => {
    const sections: SearchSection[] = [];
    const currentUser = user?.login || null;

    if (!query.raw.trim()) {
      const recentResults: SearchResult[] = [];

      for (const pinned of pinnedRepos.slice(0, 5)) {
        recentResults.push({
          id: `pinned-${pinned.fullName}`,
          type: "repo",
          title: pinned.fullName.split("/")[1],
          description: pinned.fullName,
          url: `/${pinned.fullName}`,
          repo: pinned.fullName,
        });
      }

      if (recentResults.length > 0) {
        sections.push({
          type: "repo",
          label: "Pinned Repositories",
          results: recentResults,
        });
      }

      if (includeCommands) {
        sections.push({
          type: "command",
          label: "Quick Commands",
          results: QUICK_COMMANDS,
        });
      }

      return sections;
    }

    const hasTypeFilter = query.typeFilter !== null;

    if (!hasTypeFilter || query.typeFilter === "repo") {
      const repoResults = searchRepos(repos.byId, query, limit);
      if (repoResults.length > 0) {
        sections.push({
          type: "repo",
          label: "Repositories",
          results: repoResults,
        });
      }
    }

    if (!hasTypeFilter || query.typeFilter === "issue") {
      const issueResults = searchIssues(issues.byId, query, currentUser, limit);
      if (issueResults.length > 0) {
        sections.push({
          type: "issue",
          label: "Issues",
          results: issueResults,
        });
      }
    }

    if (!hasTypeFilter || query.typeFilter === "pullRequest") {
      const prResults = searchPullRequests(
        pullRequests.byId,
        query,
        currentUser,
        limit,
      );
      if (prResults.length > 0) {
        sections.push({
          type: "pullRequest",
          label: "Pull Requests",
          results: prResults,
        });
      }
    }

    if (!hasTypeFilter || query.typeFilter === "org") {
      const orgResults = searchOrgs(orgs.byId, query, limit);
      if (orgResults.length > 0) {
        sections.push({
          type: "org",
          label: "Organizations",
          results: orgResults,
        });
      }
    }

    return sections;
  }, [
    query,
    repos.byId,
    issues.byId,
    pullRequests.byId,
    orgs.byId,
    user,
    pinnedRepos,
    limit,
    includeCommands,
  ]);
}

export function getAllResults(sections: SearchSection[]): SearchResult[] {
  return sections.flatMap((s) => s.results);
}
