"use client";

import { ConditionalSidebar } from "@/components/conditional-sidebar";

/**
 * App Dashboard - Main dashboard for authenticated users
 * This is a placeholder component that you can build out with your actual dashboard content
 */
export function AppDashboard() {
  return (
    <ConditionalSidebar>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Octomod dashboard. Start building your GitHub dashboard here.
          </p>
        </div>
        {/* Add your dashboard content here */}
      </div>
    </ConditionalSidebar>
  );
}

