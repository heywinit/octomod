import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@octomod/api/routers/index";
import { createContext } from "@octomod/api/context";
import { NextRequest } from "next/server";

function handler(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
	});
}
export { handler as GET, handler as POST };
