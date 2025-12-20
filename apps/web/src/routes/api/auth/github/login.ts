import { createFileRoute } from "@tanstack/react-router";
import { validateGitHubConfig, getRedirectUri, createCookieConfig } from "@/lib/auth.utils";
import { GITHUB_OAUTH, COOKIE_NAMES } from "@/lib/constants";
import { randomBytes } from "crypto";

export const Route = createFileRoute("/api/auth/github/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Validate GitHub OAuth configuration
        const config = validateGitHubConfig();
        if (!config.isValid || !config.clientId) {
          return new Response("GitHub OAuth not configured", { status: 500 });
        }

        // Generate a random state parameter for CSRF protection
        const state = randomBytes(32).toString("hex");

        // Store state in a cookie (expires in 10 minutes)
        const cookieConfig = createCookieConfig({ maxAge: 600 });
        const cookieParts = [
          `${COOKIE_NAMES.GITHUB_OAUTH_STATE}=${state}`,
          `Path=/`,
          `Max-Age=${cookieConfig.maxAge}`,
          `SameSite=${cookieConfig.sameSite}`,
        ];
        if (cookieConfig.httpOnly) {
          cookieParts.push("HttpOnly");
        }
        if (cookieConfig.secure) {
          cookieParts.push("Secure");
        }
        const cookieString = cookieParts.join("; ");

        // Build GitHub OAuth authorization URL
        const redirectUri = getRedirectUri(request);
        const params = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: redirectUri,
          scope: GITHUB_OAUTH.SCOPE,
          state,
        });

        const authUrl = `${GITHUB_OAUTH.AUTHORIZE_URL}?${params.toString()}`;

        // Redirect to GitHub with state cookie
        return new Response(null, {
          status: 302,
          headers: {
            Location: authUrl,
            "Set-Cookie": cookieString,
          },
        });
      },
    },
  },
});
