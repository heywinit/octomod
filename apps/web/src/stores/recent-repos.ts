import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Repo } from "./pinned-repos";

interface RecentReposStore {
	recentRepos: Repo[];
	maxRecent: number;
	addRecent: (repo: Repo) => void;
	clearRecent: () => void;
	getRecent: (limit?: number) => Repo[];
}

const MAX_RECENT_DEFAULT = 10;

export const useRecentRepos = create<RecentReposStore>()(
	persist(
		(set, get) => ({
			recentRepos: [],
			maxRecent: MAX_RECENT_DEFAULT,
			addRecent: (repo) =>
				set((state) => {
					// Remove if already exists to avoid duplicates
					const filtered = state.recentRepos.filter(
						(r) => r.id !== repo.id,
					);
					// Add to the beginning and limit to maxRecent
					return {
						recentRepos: [repo, ...filtered].slice(
							0,
							state.maxRecent,
						),
					};
				}),
			clearRecent: () => set({ recentRepos: [] }),
			getRecent: (limit) => {
				const repos = get().recentRepos;
				return limit ? repos.slice(0, limit) : repos;
			},
		}),
		{
			name: "octomod-recent-repos",
		},
	),
);

