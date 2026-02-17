import { getOctokitFromStorage } from "@/lib/octokit";
import type { ParsedQuery, SearchResult } from "./types";

export interface GitHubSearchItem {
  id: number;
  name?: string;
  full_name?: string;
  description?: string | null;
  html_url: string;
  owner?: {
    login: string;
    avatar_url: string;
  };
  number?: number;
  title?: string;
  state?: string;
  labels?: Array<{ name: string; color: string }>;
  user?: {
    login: string;
    avatar_url: string;
  };
  draft?: boolean;
  merged_at?: string | null;
  created_at?: string;
  updated_at?: string;
  language?: string | null;
  stargazers_count?: number;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubSearchItem[];
}

function buildSearchQuery(query: ParsedQuery): string {
  const parts: string[] = [];

  if (query.searchTerms.length > 0) {
    parts.push(query.searchTerms.join(" "));
  }

  if (query.filters.isOpen) {
    parts.push("is:open");
  } else if (query.filters.isClosed) {
    parts.push("is:closed");
  }

  if (query.typeFilter === "pullRequest") {
    parts.push("is:pr");
  } else if (query.typeFilter === "issue") {
    parts.push("is:issue");
  }

  if (query.filters.isDraft) {
    parts.push("is:draft");
  }

  if (query.filters.label) {
    parts.push(`label:"${query.filters.label}"`);
  }

  if (query.filters.language) {
    parts.push(`language:${query.filters.language}`);
  }

  return parts.join(" ");
}

export async function searchGitHub(
  query: ParsedQuery,
  type: "repositories" | "issues" | "pr" = "repositories",
): Promise<SearchResult[]> {
  const octokit = getOctokitFromStorage();
  if (!octokit) {
    return [];
  }

  const searchQuery = buildSearchQuery(query);
  if (!searchQuery.trim()) {
    return [];
  }

  try {
    let response: GitHubSearchResponse;

    if (type === "repositories") {
      const res = await octokit.rest.search.repos({
        q: searchQuery,
        per_page: 10,
        sort: "updated",
      });
      response = res.data as GitHubSearchResponse;
    } else if (type === "issues") {
      const res = await octokit.rest.search.issuesAndPullRequests({
        q: `${searchQuery} is:issue`,
        per_page: 10,
        sort: "updated",
      });
      response = res.data as GitHubSearchResponse;
    } else {
      const res = await octokit.rest.search.issuesAndPullRequests({
        q: `${searchQuery} is:pr`,
        per_page: 10,
        sort: "updated",
      });
      response = res.data as GitHubSearchResponse;
    }

    return response.items.map((item: GitHubSearchItem) => {
      if (type === "repositories") {
        return {
          id: `gh-repo-${item.id}`,
          type: "repo" as const,
          title: item.name || "",
          description: item.description || item.full_name || "",
          url: item.html_url,
          repo: item.full_name,
          timeAgo: item.updated_at
            ? formatTimeAgo(new Date(item.updated_at))
            : undefined,
        };
      }

      const isPr = type === "pr";
      const resultType: "pullRequest" | "issue" = isPr
        ? "pullRequest"
        : "issue";
      return {
        id: `gh-${isPr ? "pr" : "issue"}-${item.id}`,
        type: resultType,
        title: item.title || "",
        description: item.full_name ? `${item.full_name} #${item.number}` : "",
        url: item.html_url,
        repo: item.full_name,
        number: item.number,
        labels: item.labels?.map((l: { name: string; color: string }) => ({
          name: l.name,
          color: l.color,
        })),
        state: item.state === "open" ? "open" : "closed",
        isDraft: item.draft,
        timeAgo: item.updated_at
          ? formatTimeAgo(new Date(item.updated_at))
          : undefined,
      };
    });
  } catch (error) {
    console.error("GitHub search error:", error);
    return [];
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return "just now";
}
