import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_RECENT_SEARCHES = 10;

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface RecentSearchesStore {
  searches: RecentSearch[];
  addSearch: (query: string) => void;
  removeSearch: (id: string) => void;
  clearSearches: () => void;
}

export const useRecentSearches = create<RecentSearchesStore>()(
  persist(
    (set) => ({
      searches: [],
      addSearch: (query: string) => {
        if (!query.trim()) return;
        set((state) => {
          const existing = state.searches.findIndex((s) => s.query === query);
          if (existing !== -1) {
            const newSearches = [...state.searches];
            newSearches.splice(existing, 1);
            return {
              searches: [
                { id: `search-${Date.now()}`, query, timestamp: Date.now() },
                ...newSearches,
              ].slice(0, MAX_RECENT_SEARCHES),
            };
          }
          return {
            searches: [
              { id: `search-${Date.now()}`, query, timestamp: Date.now() },
              ...state.searches,
            ].slice(0, MAX_RECENT_SEARCHES),
          };
        });
      },
      removeSearch: (id: string) => {
        set((state) => ({
          searches: state.searches.filter((s) => s.id !== id),
        }));
      },
      clearSearches: () => {
        set({ searches: [] });
      },
    }),
    {
      name: "octomod-recent-searches",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
