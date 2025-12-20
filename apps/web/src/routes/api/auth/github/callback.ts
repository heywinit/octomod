import { createFileRoute } from "@tanstack/react-router";
import {
  createCookieConfig,
  createErrorRedirect,
  getRedirectUri,
  validateGitHubConfig,
} from "@/lib/auth.utils";
import { COOKIE_NAMES, GITHUB_OAUTH } from "@/lib/constants";

export const Route = createFileRoute("/api/auth/github/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        // Handle OAuth errors
        if (error) {
          return createErrorRedirect(request, error);
        }

        // Validate required parameters
        if (!code || !state) {
          return createErrorRedirect(request, "missing_parameters");
        }

        // Validate GitHub OAuth configuration
        const config = validateGitHubConfig();
        if (!config.isValid || !config.clientId || !config.clientSecret) {
          return createErrorRedirect(request, "server_error");
        }

        // Verify state parameter from cookie
        const cookies = request.headers.get("cookie") || "";
        const stateCookie = cookies
          .split("; ")
          .find((c) => c.startsWith(`${COOKIE_NAMES.GITHUB_OAUTH_STATE}=`))
          ?.split("=")[1];

        if (!stateCookie || stateCookie !== state) {
          return createErrorRedirect(request, "invalid_state");
        }

        // Exchange code for access token
        const redirectUri = getRedirectUri(request);
        try {
          const tokenResponse = await fetch(GITHUB_OAUTH.ACCESS_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              client_id: config.clientId,
              client_secret: config.clientSecret,
              code,
              redirect_uri: redirectUri,
            }),
          });

          if (!tokenResponse.ok) {
            return createErrorRedirect(request, "token_exchange_failed");
          }

          const tokenData = await tokenResponse.json();

          if (tokenData.error) {
            return createErrorRedirect(request, tokenData.error);
          }

          const accessToken = tokenData.access_token;

          if (!accessToken) {
            return createErrorRedirect(request, "no_token");
          }

          // Clear the state cookie
          const clearCookieString = `${COOKIE_NAMES.GITHUB_OAUTH_STATE}=; Path=/; Max-Age=0; SameSite=Lax`;

          // Store token temporarily in a cookie (will be moved to localStorage by client)
          // This is a temporary solution - in production, you might want to use httpOnly cookies
          const tokenCookieConfig = createCookieConfig({
            httpOnly: false,
            maxAge: 60,
          }); // 1 minute
          const tokenCookieParts = [
            `${COOKIE_NAMES.GITHUB_TOKEN_TEMP}=${accessToken}`,
            "Path=/",
            `Max-Age=${tokenCookieConfig.maxAge}`,
            `SameSite=${tokenCookieConfig.sameSite}`,
          ];
          if (tokenCookieConfig.secure) {
            tokenCookieParts.push("Secure");
          }
          const tokenCookieString = tokenCookieParts.join("; ");

          // Redirect to home page with success
          // The client will read the token from the cookie and store it in localStorage
          const headers = new Headers();
          headers.set("Location", "/?auth=success");
          headers.append("Set-Cookie", clearCookieString);
          headers.append("Set-Cookie", tokenCookieString);

          return new Response(null, {
            status: 302,
            headers,
          });
        } catch (error) {
          console.error("OAuth callback error:", error);
          return createErrorRedirect(request, "server_error");
        }
      },
    },
  },
});
