import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Respond quickly to GitHub (within 10 seconds)
    // We'll process the webhook asynchronously
    const response = new Response("Accepted", { status: 202 });

    // Get the event type from the header
    const githubEvent = request.headers.get("x-github-event");
    const githubDelivery = request.headers.get("x-github-delivery");
    // Get signature for verification (will be used in TODO below)
    const _githubSignature = request.headers.get("x-hub-signature-256");

    // Parse the webhook payload
    const payload = await request.json();

    // Log the webhook delivery for debugging
    console.log("GitHub webhook received:", {
      event: githubEvent,
      delivery: githubDelivery,
      repository: payload.repository?.full_name,
    });

    // Handle different event types
    switch (githubEvent) {
      case "ping":
        console.log("GitHub webhook ping received - webhook is working!");
        break;

      case "push":
        console.log(`Push event: ${payload.head_commit?.message}`);
        // Add your push event handling logic here
        break;

      case "pull_request":
        console.log(
          `Pull request ${payload.action}: ${payload.pull_request?.title}`,
        );
        // Add your pull request handling logic here
        break;

      case "issues":
        console.log(`Issue ${payload.action}: ${payload.issue?.title}`);
        // Add your issue handling logic here
        break;

      default:
        console.log(`Unhandled event type: ${githubEvent}`);
    }

    // TODO: Add webhook signature verification for security
    // See: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

    // TODO: Process the webhook asynchronously if needed
    // You can dispatch to a queue or process in the background

    return response;
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Optionally handle GET requests for health checks
export async function GET() {
  return new Response("GitHub webhook endpoint is ready", { status: 200 });
}
