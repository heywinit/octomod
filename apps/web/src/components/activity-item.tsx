"use client";

import { formatTimeAgo } from "@/lib/dashboard.service";

interface ActivityItemProps {
  activity: {
    id: string;
    title: string;
    description: string;
    updatedAt: string;
  };
}

/**
 * Activity Feed Item Component
 * Visually quieter, no avatars, high context
 */
export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">{activity.title}</span>
        <span className="text-muted-foreground text-xs">{activity.description}</span>
      </div>
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatTimeAgo(new Date(activity.updatedAt))}
      </span>
    </div>
  );
}

