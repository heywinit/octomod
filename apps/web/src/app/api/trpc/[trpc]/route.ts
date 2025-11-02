import { createContext } from "@octomod/api/context";
import { appRouter } from "@octomod/api/routers/index";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req.headers),
  });
}
export { handler as GET, handler as POST };
