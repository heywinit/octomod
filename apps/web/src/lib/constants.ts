/**
 * API Routes - Used across multiple files
 */
export const API_ROUTES = {
  AUTH: {
    GITHUB: {
      LOGIN: "/api/auth/github/login",
      CALLBACK: "/api/auth/github/callback",
    },
  },
  REPOSITORIES: "/api/repositories",
} as const;

/**
 * GitHub OAuth URLs - Used in login and callback routes
 */
export const GITHUB_OAUTH = {
  AUTHORIZE_URL: "https://github.com/login/oauth/authorize",
  ACCESS_TOKEN_URL: "https://github.com/login/oauth/access_token",
  SCOPE: "repo user",
} as const;

/**
 * Storage Keys - Used across client components
 */
export const STORAGE_KEYS = {
  GITHUB_TOKEN: "github_token",
} as const;

/**
 * Cookie Names - Used in login and callback routes
 */
export const COOKIE_NAMES = {
  GITHUB_OAUTH_STATE: "github_oauth_state",
  GITHUB_TOKEN_TEMP: "github_token_temp",
} as const;
