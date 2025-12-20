import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/app-dashboard";

export const Route = createFileRoute("/inbox")({
  component: InboxPage,
});

function InboxPage() {
  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            Your notifications and messages will appear here.
          </p>
        </div>
      </div>
    </AppDashboard>
  );
}
