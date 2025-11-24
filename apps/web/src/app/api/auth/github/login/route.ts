import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_ROUTES, COOKIE_NAMES, GITHUB_OAUTH } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ||
    `${request.nextUrl.origin}${API_ROUTES.AUTH.GITHUB.CALLBACK}`;

  if (!clientId) {
    return NextResponse.json(
      { error: "GITHUB_CLIENT_ID is not configured" },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: GITHUB_OAUTH.SCOPE,
    state,
  });

  const githubAuthUrl = `${GITHUB_OAUTH.AUTHORIZE_URL}?${params.toString()}`;

  const response = NextResponse.redirect(githubAuthUrl);
  response.cookies.set(COOKIE_NAMES.GITHUB_OAUTH_STATE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  return response;
}
