"use client";

import { AlertCircle } from "lucide-react";
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
 * Actionable, 1-line title, repo name + status pills
 */
export function IssueCard({ issue }: IssueCardProps) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 transition-colors hover:bg-muted",
        issue.waitingOnYou && "bg-yellow-500/5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            issue.state === "open" ? "bg-green-500" : "bg-muted-foreground",
          )}
        />
        <span className="truncate text-sm font-medium">{issue.title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground text-xs">{issue.repository}</span>
        {issue.waitingOnYou && (
          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-yellow-600 text-xs dark:text-yellow-500">
            Waiting on you
          </span>
        )}
        {issue.labels && issue.labels.length > 0 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
            {issue.labels[0]}
          </span>
        )}
        <span className="text-muted-foreground text-xs">{issue.timeAgo}</span>
      </div>
    </a>
  );
}

