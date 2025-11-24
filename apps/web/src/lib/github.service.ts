import { STORAGE_KEYS } from "./constants";
import { createOctokitClient } from "./octokit";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
}

/**
 * Fetches the user's repositories using Octokit
 * @param token - GitHub access token
 * @param limit - Maximum number of repositories to fetch (default: 5)
 * @returns Array of repositories sorted by most recently updated
 */
export async function fetchRepositories(
  token: string,
  limit = 5,
): Promise<Repository[]> {
  const octokit = createOctokitClient(token);

  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      direction: "desc",
      per_page: limit,
      type: "all",
    });

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      updated_at: repo.updated_at || new Date().toISOString(),
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
    }));
  } catch (error: unknown) {
    console.error("Error fetching repositories:", error);

    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      if (status === 401) {
        // Token is invalid, clear it
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
        }
        throw new Error("Session expired. Please login again.");
      }
    }

    throw new Error("Failed to fetch repositories");
  }
}

/**
 * Gets the GitHub access token from localStorage
 * @returns The token if found, null otherwise
 */
export function getGitHubToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
}
