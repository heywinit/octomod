import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/app-dashboard";

export const Route = createFileRoute("/repos")({
  component: ReposPage,
});

function ReposPage() {
  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Browse and manage your repositories.
          </p>
        </div>
      </div>
    </AppDashboard>
  );
}
