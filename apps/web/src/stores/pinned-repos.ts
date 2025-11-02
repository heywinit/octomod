import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Repo {
	id: string;
	name: string;
	owner: string;
	fullName: string;
	description?: string;
	stargazersCount?: number;
	language?: string;
	updatedAt?: string;
}

interface PinnedReposStore {
	pinnedRepos: Repo[];
	pinRepo: (repo: Repo) => void;
	unpinRepo: (repoId: string) => void;
	isPinned: (repoId: string) => boolean;
	togglePin: (repo: Repo) => void;
}

export const usePinnedRepos = create<PinnedReposStore>()(
	persist(
		(set, get) => ({
			pinnedRepos: [],
			pinRepo: (repo) =>
				set((state) => ({
					pinnedRepos: state.pinnedRepos.some((r) => r.id === repo.id)
						? state.pinnedRepos
						: [...state.pinnedRepos, repo],
				})),
			unpinRepo: (repoId) =>
				set((state) => ({
					pinnedRepos: state.pinnedRepos.filter((r) => r.id !== repoId),
				})),
			isPinned: (repoId) =>
				get().pinnedRepos.some((r) => r.id === repoId),
			togglePin: (repo) => {
				const isPinned = get().isPinned(repo.id);
				if (isPinned) {
					get().unpinRepo(repo.id);
				} else {
					get().pinRepo(repo);
				}
			},
		}),
		{
			name: "octomod-pinned-repos",
		},
	),
);

