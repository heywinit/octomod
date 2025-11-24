import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createOctokitClient } from "@/lib/octokit";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return NextResponse.json(
			{ error: "Missing or invalid authorization header" },
			{ status: 401 },
		);
	}

	const token = authHeader.replace("Bearer ", "");
	const octokit = createOctokitClient(token);

	try {
		// Get user's repositories, sorted by updated_at (most recently updated first)
		const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
			sort: "updated",
			direction: "desc",
			per_page: 5,
			type: "all",
		});

		return NextResponse.json({ repositories: repos });
	} catch (error: unknown) {
		console.error("Error fetching repositories:", error);

		if (error && typeof error === "object" && "status" in error) {
			return NextResponse.json(
				{ error: "Failed to fetch repositories" },
				{ status: (error as { status: number }).status },
			);
		}

		return NextResponse.json(
			{ error: "Failed to fetch repositories" },
			{ status: 500 },
		);
	}
}
