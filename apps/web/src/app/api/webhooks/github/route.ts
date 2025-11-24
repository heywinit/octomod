import type { NextRequest } from "next/server";

export async function POST(_request: NextRequest) {}

export async function GET() {
  return new Response("GitHub webhook endpoint is ready", { status: 200 });
}
