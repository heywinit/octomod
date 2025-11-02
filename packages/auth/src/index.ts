import { db } from "@octomod/db";
import * as schema from "@octomod/db/schema/auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

// Provide default values for build-time to prevent failures
// These will be overridden at runtime with actual env vars
const getAuthConfig = (): BetterAuthOptions => ({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET || "dummy-secret-for-build",
  plugins: [nextCookies()],
});

export const auth = betterAuth<BetterAuthOptions>(getAuthConfig());
