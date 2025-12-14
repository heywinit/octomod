import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createCookieConfig,
  createErrorRedirect,
  validateGitHubConfig,
} from "@/lib/auth.utils";
import { COOKIE_NAMES, GITHUB_OAUTH } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(
    COOKIE_NAMES.GITHUB_OAUTH_STATE,
  )?.value;

  if (!code || !state || state !== storedState) {
    return createErrorRedirect(request, "invalid_state");
  }

  const { clientId, clientSecret, isValid } = validateGitHubConfig();

  if (!isValid) {
    return createErrorRedirect(request, "missing_config");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_OAUTH.ACCESS_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return createErrorRedirect(request, tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Redirect to home page with token in URL fragment (will be handled client-side)
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(COOKIE_NAMES.GITHUB_OAUTH_STATE);

    // Store token in a temporary cookie that will be read by client and moved to localStorage
    response.cookies.set(
      COOKIE_NAMES.GITHUB_TOKEN_TEMP,
      accessToken,
      createCookieConfig({
        httpOnly: false, // Needs to be accessible from client
        maxAge: 60, // 1 minute - just long enough for client to read it
      }),
    );

    return response;
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return createErrorRedirect(request, "oauth_failed");
  }
}
