import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

interface AuthStore {
  token: string | null;
  user: GitHubUser | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: GitHubUser | null) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token: string | null) => {
        // Also sync with localStorage for backward compatibility
        if (typeof window !== "undefined") {
          if (token) {
            localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
          } else {
            localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
          }
        }
        set({ token, isAuthenticated: !!token });
      },

      setUser: (user: GitHubUser | null) => {
        set({ user });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
        }
        set({ token: null, user: null, isAuthenticated: false });
      },

      checkAuth: () => {
        // Check localStorage for token and sync with store
        if (typeof window !== "undefined") {
          const token = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
          set({ token, isAuthenticated: !!token });
        }
      },
    }),
    {
      name: "octomod-auth",
      // Only persist token and user, not isAuthenticated (it's derived)
      partialize: (state: AuthStore) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);

