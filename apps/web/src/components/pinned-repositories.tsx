"use client";

import { AlertCircle, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { usePinnedRepos, type Repo } from "@/stores/pinned-repos";
import { useRecentRepos } from "@/lib/sync";
import { Button } from "@/components/ui/button";

interface PinnedRepositoryCardProps {
  repo: {
    id: string;
    name: string;
    owner: string;
    fullName: string;
    ciStatus?: "passing" | "failing" | "pending" | "unknown";
    openIssueCount?: number;
    lastActivity?: string;
  };
}

/**
 * Individual Pinned Repository Card Component
 */
function PinnedRepositoryCard({ repo }: PinnedRepositoryCardProps) {
  const getCIStatusColor = (status?: string) => {
    switch (status) {
      case "passing":
        return "bg-green-500";
      case "failing":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <a
      href={`https://github.com/${repo.fullName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={cn(
              "size-2 shrink-0 rounded-full",
              getCIStatusColor(repo.ciStatus),
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-sm">{repo.name}</span>
            </div>
            <span className="text-muted-foreground text-xs">{repo.owner}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        {repo.openIssueCount !== undefined && (
          <span className="flex items-center gap-1">
            <AlertCircle className="size-3" />
            {repo.openIssueCount}
          </span>
        )}
        {repo.lastActivity && (
          <span className="ml-auto">
            {formatTimeAgo(new Date(repo.lastActivity))}
          </span>
        )}
      </div>
    </a>
  );
}

interface SuggestedRepositoryCardProps {
  repo: {
    id: number;
    name: string;
    fullName: string;
    owner: {
      login: string;
      avatarUrl: string;
    };
    description: string | null;
    updatedAt: string;
    pushedAt: string;
    language: string | null;
    stargazersCount: number;
  };
}

/**
 * Suggested Repository Card Component
 * Shows repos that could be pinned, with a pin button
 */
function SuggestedRepositoryCard({ repo }: SuggestedRepositoryCardProps) {
  const { togglePin, isPinned } = usePinnedRepos();
  const pinned = isPinned(String(repo.id));

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePin({
      id: String(repo.id),
      name: repo.name,
      owner: repo.owner.login,
      fullName: repo.fullName,
      description: repo.description || undefined,
      stargazersCount: repo.stargazersCount,
      language: repo.language || undefined,
      updatedAt: repo.updatedAt,
    });
  };

  return (
    <a
      href={`https://github.com/${repo.fullName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-3 rounded-lg bg-muted/20 p-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">{repo.name}</span>
          {repo.language && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
              {repo.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{repo.owner.login}</span>
          {repo.stargazersCount > 0 && (
            <span className="text-muted-foreground text-xs">
              ⭐ {repo.stargazersCount}
            </span>
          )}
          <span className="text-muted-foreground text-xs">
            {formatTimeAgo(new Date(repo.pushedAt || repo.updatedAt))}
          </span>
        </div>
        {repo.description && (
          <p className="line-clamp-1 text-muted-foreground text-xs">
            {repo.description}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePin}
        className={cn(
          "h-7 w-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100",
          pinned && "opacity-100",
        )}
        title={pinned ? "Unpin repository" : "Pin repository"}
      >
        {pinned ? (
          <Pin className="size-4 fill-current" />
        ) : (
          <PinOff className="size-4" />
        )}
      </Button>
    </a>
  );
}

/**
 * Pinned Repositories Section Component
 * Shows list of pinned repos, or suggests repos if none are pinned
 */
export function PinnedRepositories({
  pinnedReposEnriched,
}: {
  pinnedReposEnriched: Array<{
    id: string;
    name: string;
    owner: string;
    fullName: string;
    ciStatus?: "passing" | "failing" | "pending" | "unknown";
    openIssueCount?: number;
    lastActivity?: string;
  }>;
}) {
  const { pinnedRepos } = usePinnedRepos();
  const recentRepos = useRecentRepos(5);

  // Filter out already pinned repos from suggestions
  const pinnedFullNames = new Set(pinnedRepos.map((r) => r.fullName));
  const suggestedRepos = recentRepos.filter(
    (repo) => !pinnedFullNames.has(repo.fullName),
  );

  if (pinnedReposEnriched.length > 0) {
    return (
      <div className="flex flex-col gap-1.5">
        {pinnedReposEnriched.slice(0, 5).map((repo) => (
          <PinnedRepositoryCard key={repo.id} repo={repo} />
        ))}
      </div>
    );
  }

  // Show suggestions when no repos are pinned
  if (suggestedRepos.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">
          No pinned repositories. Here are some suggestions:
        </p>
        <div className="flex flex-col gap-1.5">
          {suggestedRepos.slice(0, 5).map((repo) => (
            <SuggestedRepositoryCard key={repo.id} repo={repo} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-muted/30 px-3 py-6 text-center">
      <p className="text-muted-foreground text-sm">
        No pinned repositories. Sync your repos to see suggestions.
      </p>
    </div>
  );
}

