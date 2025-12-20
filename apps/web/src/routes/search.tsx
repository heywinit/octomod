import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/app-dashboard";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">Search</h1>
          <p className="text-muted-foreground">
            Search across repositories, issues, and pull requests.
          </p>
        </div>
      </div>
    </AppDashboard>
  );
}
