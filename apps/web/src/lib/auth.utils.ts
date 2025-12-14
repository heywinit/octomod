import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_ROUTES } from "./constants";

/**
 * Validates GitHub OAuth environment variables
 */
export function validateGitHubConfig(): {
  clientId: string | undefined;
  clientSecret: string | undefined;
  isValid: boolean;
} {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  return {
    clientId,
    clientSecret,
    isValid: !!clientId && !!clientSecret,
  };
}

/**
 * Gets the GitHub redirect URI, using environment variable or constructing from request
 */
export function getRedirectUri(request: NextRequest): string {
  return (
    process.env.GITHUB_REDIRECT_URI ||
    `${request.nextUrl.origin}${API_ROUTES.AUTH.GITHUB.CALLBACK}`
  );
}

/**
 * Creates a cookie configuration with common defaults
 */
export function createCookieConfig(options: {
  httpOnly?: boolean;
  maxAge: number;
}): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
} {
  return {
    httpOnly: options.httpOnly ?? true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: options.maxAge,
  };
}

/**
 * Creates an error redirect response
 */
export function createErrorRedirect(
  request: NextRequest,
  error: string,
): NextResponse {
  return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
}



