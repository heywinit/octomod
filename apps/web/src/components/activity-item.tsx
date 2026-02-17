"use client";

import { CircleDot, GitPullRequest, MessageSquare } from "lucide-react";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: {
    id: string;
    type: "issue" | "pr";
    title: string;
    description: string;
    updatedAt: string;
    url: string;
    repository: string;
    user: { login: string; avatarUrl: string };
    state: "open" | "closed" | "merged";
    labels: Array<{ name: string; color: string }>;
    comments: number;
    isAssignedToYou: boolean;
    isReviewRequested: boolean;
    isDraft: boolean;
  };
}

/**
 * Activity Feed Item Component
 * Natural language, contextual, high context
 */
export function ActivityItem({ activity }: ActivityItemProps) {
  const isPR = activity.type === "pr";

  return (
    <a
      href={activity.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5 transition-colors hover:bg-accent",
        activity.isReviewRequested && "border-blue-500/30 bg-blue-500/5",
        activity.isAssignedToYou &&
          !activity.isReviewRequested &&
          "border-yellow-500/30 bg-yellow-500/5",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 shrink-0",
          isPR ? "text-blue-500" : "text-green-500",
        )}
      >
        {isPR ? (
          <GitPullRequest className="size-4" />
        ) : (
          <CircleDot className="size-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">
            {activity.title}
          </span>
          {activity.isDraft && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
              draft
            </span>
          )}
          {activity.state === "merged" && (
            <span className="shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 text-purple-600 text-xs dark:text-purple-400">
              merged
            </span>
          )}
          {activity.state === "closed" && !isPR && (
            <span className="shrink-0 rounded bg-muted/50 px-1.5 py-0.5 text-muted-foreground text-xs">
              closed
            </span>
          )}
        </div>

        {/* Context row */}
        <div className="flex flex-wrap items-center gap-y-1 text-muted-foreground text-xs">
          <span className="text-foreground/70">{activity.user.login}</span>
          <span className="text-border">·</span>
          <span>{activity.description}</span>
          <span className="text-border">·</span>
          <span className="text-foreground/50">{activity.repository}</span>
          {activity.comments > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" />
                {activity.comments}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatTimeAgo(new Date(activity.updatedAt))}
      </span>
    </a>
  );
}
