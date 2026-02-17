"use client";

import { CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: {
    id: string;
    number: number;
    title: string;
    repository: string;
    state: "open" | "closed";
    url: string;
    timeAgo: string;
    labels?: string[];
    waitingOnYou?: boolean;
  };
}

/**
 * Compact Issue Card Component
 * Natural language, contextual
 */
export function IssueCard({ issue }: IssueCardProps) {
  const primaryLabel = issue.labels?.[0];

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5 transition-colors hover:bg-accent",
        issue.waitingOnYou && "border-yellow-500/30 bg-yellow-500/5",
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0 text-green-500">
        <CircleDot className="size-4" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">
            {issue.title}
          </span>
          {issue.state === "closed" && (
            <span className="shrink-0 rounded bg-muted/50 px-1.5 py-0.5 text-muted-foreground text-xs">
              closed
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-y-1 text-muted-foreground text-xs">
          <span>{issue.repository}</span>
          <span className="text-border">·</span>
          {issue.waitingOnYou ? (
            <span className="text-yellow-600 dark:text-yellow-500">
              assigned to you
            </span>
          ) : primaryLabel ? (
            <span>{primaryLabel}</span>
          ) : null}
          {issue.waitingOnYou && (
            <>
              <span className="text-border">·</span>
              <span>{issue.timeAgo}</span>
            </>
          )}
          {!issue.waitingOnYou && (
            <>
              <span className="text-border">·</span>
              <span>{issue.timeAgo}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
