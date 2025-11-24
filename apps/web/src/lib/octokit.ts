import { Octokit } from "octokit";
import { STORAGE_KEYS } from "./constants";

/**
 * Creates an Octokit instance with the provided access token
 */
export function createOctokitClient(token: string) {
	return new Octokit({
		auth: token,
	});
}

/**
 * Gets the Octokit instance from localStorage token
 * Returns null if no token is found
 */
export function getOctokitFromStorage(): Octokit | null {
	if (typeof window === "undefined") {
		return null;
	}

	const token = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
	if (!token) {
		return null;
	}

	return createOctokitClient(token);
}

