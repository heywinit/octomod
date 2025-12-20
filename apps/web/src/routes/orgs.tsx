import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/app-dashboard";

export const Route = createFileRoute("/orgs")({
  component: OrgsPage,
});

function OrgsPage() {
  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            Organizations
          </h1>
          <p className="text-muted-foreground">
            Manage your organizations and teams.
          </p>
        </div>
      </div>
    </AppDashboard>
  );
}
