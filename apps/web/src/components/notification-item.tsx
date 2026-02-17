"use client";

import {
  AlertTriangle,
  CircleDot,
  GitPullRequest,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    type: "review_requested" | "assigned" | "mention" | "ci_failed";
    title: string;
    description: string;
    repository: string;
    url: string;
    timeAgo: string;
  };
}

const iconMap = {
  review_requested: GitPullRequest,
  assigned: UserPlus,
  mention: CircleDot,
  ci_failed: AlertTriangle,
};

const colorMap = {
  review_requested: "text-blue-500",
  assigned: "text-yellow-500",
  mention: "text-green-500",
  ci_failed: "text-red-500",
};

const bgMap = {
  review_requested: "bg-blue-500/10 border-blue-500/30",
  assigned: "bg-yellow-500/10 border-yellow-500/30",
  mention: "bg-green-500/10 border-green-500/30",
  ci_failed: "bg-red-500/10 border-red-500/30",
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const Icon = iconMap[notification.type];
  const colorClass = colorMap[notification.type];
  const bgClass = bgMap[notification.type];

  return (
    <a
      href={notification.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors hover:bg-accent",
        bgClass,
      )}
    >
      <div className={cn("mt-0.5 shrink-0", colorClass)}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-foreground text-sm">
          {notification.title}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <span>{notification.repository} · {notification.description}</span>
        </span>
      </div>
    </a>
  );
}
