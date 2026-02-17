"use client";

import { AlertCircle, Loader2, Pin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/revola";
import { formatTimeAgo } from "@/lib/dashboard.service";
import { useEntityCache, useRecentRepos } from "@/lib/sync";
import { getOctokit } from "@/lib/sync/github-api";
import { cn } from "@/lib/utils";
import type { Repo } from "@/stores/pinned-repos";
import { usePinnedRepos } from "@/stores/pinned-repos";

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
  const { unpinRepo } = usePinnedRepos();

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

  const handleUnpin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    unpinRepo(repo.id);
  };

  return (
    <a
      href={`https://github.com/${repo.fullName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-2 rounded-md border border-border/50 bg-card py-1.5 pr-2 pl-2.5 transition-colors hover:bg-accent"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            getCIStatusColor(repo.ciStatus),
          )}
        />
        <span className="truncate font-medium text-sm">{repo.name}</span>
        <span className="shrink-0 text-muted-foreground text-xs">
          {repo.owner}
        </span>
        {repo.openIssueCount !== undefined && repo.openIssueCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
            <AlertCircle className="size-3" />
            {repo.openIssueCount}
          </span>
        )}
        {repo.lastActivity && (
          <span className="ml-auto shrink-0 text-muted-foreground text-xs">
            {formatTimeAgo(new Date(repo.lastActivity))}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnpin}
        className="h-6 w-6 shrink-0 p-0"
        title="Unpin repository"
      >
        <Pin className="size-3 fill-current" />
      </Button>
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
          <span className="text-muted-foreground text-xs">
            {repo.owner.login}
          </span>
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
        <Pin className="size-4 fill-current" />
      </Button>
    </a>
  );
}

/**
 * Parse GitHub URL or owner/repo string to extract owner and repo name
 */
function parseGitHubRepo(
  input: string,
): { owner: string; repo: string } | null {
  if (!input.trim()) return null;

  // Remove whitespace and trailing slashes
  const cleaned = input.trim().replace(/\/+$/, "");

  // Handle full GitHub URLs (with or without protocol, with or without www)
  const urlMatch = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s?#]+)\/([^/\s?#]+)/i,
  );
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  // Handle owner/repo format
  const simpleMatch = cleaned.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (simpleMatch) {
    return { owner: simpleMatch[1], repo: simpleMatch[2] };
  }

  return null;
}

/**
 * Repository Picker Dialog Component
 */
function RepositoryPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { togglePin, isPinned } = usePinnedRepos();
  const { repos } = useEntityCache();
  const [searchQuery, setSearchQuery] = useState("");
  const [customRepo, setCustomRepo] = useState<{
    owner: string;
    repo: string;
    loading: boolean;
    error: string | null;
    data: Repo | null;
  } | null>(null);

  // Get all available repositories from cache
  const allRepos = useMemo(() => {
    return Object.values(repos.byId).sort((a, b) =>
      (b.pushedAt || b.updatedAt).localeCompare(a.pushedAt || a.updatedAt),
    );
  }, [repos.byId]);

  // Filter repos based on search query
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return allRepos;

    const query = searchQuery.toLowerCase();
    return allRepos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.fullName.toLowerCase().includes(query) ||
        repo.owner.login.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query),
    );
  }, [allRepos, searchQuery]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setCustomRepo(null);
    }
  }, [open]);

  // Watch for URL-like input and fetch repo
  useEffect(() => {
    // Debounce to prevent multiple fetches when pasting
    const timeoutId = setTimeout(() => {
      const parsed = parseGitHubRepo(searchQuery);
      if (parsed) {
        // Check if repo is already in cache
        const cached = allRepos.find(
          (r) =>
            r.owner.login.toLowerCase() === parsed.owner.toLowerCase() &&
            r.name.toLowerCase() === parsed.repo.toLowerCase(),
        );

        if (cached) {
          setCustomRepo(null);
          return;
        }

        // Skip if we're already fetching/loaded this exact repo
        if (
          customRepo &&
          customRepo.owner === parsed.owner &&
          customRepo.repo === parsed.repo &&
          (customRepo.loading || customRepo.data)
        ) {
          return;
        }

        // Fetch from GitHub API
        setCustomRepo({
          owner: parsed.owner,
          repo: parsed.repo,
          loading: true,
          error: null,
          data: null,
        });

        const fetchRepo = async () => {
          try {
            const octokit = getOctokit();
            if (!octokit) {
              throw new Error("Not authenticated");
            }

            const { data } = await octokit.rest.repos.get({
              owner: parsed.owner,
              repo: parsed.repo,
            });

            setCustomRepo({
              owner: parsed.owner,
              repo: parsed.repo,
              loading: false,
              error: null,
              data: {
                id: String(data.id),
                name: data.name,
                owner: data.owner.login,
                fullName: data.full_name,
                description: data.description || undefined,
                stargazersCount: data.stargazers_count,
                language: data.language || undefined,
                updatedAt: data.updated_at,
              },
            });
          } catch (error) {
            setCustomRepo({
              owner: parsed.owner,
              repo: parsed.repo,
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch repository",
              data: null,
            });
          }
        };

        fetchRepo();
      } else {
        // Only clear if we had a custom repo showing
        if (customRepo && !customRepo.loading) {
          setCustomRepo(null);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allRepos]);

  const handleTogglePin = (repo: Repo) => {
    togglePin(repo);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} onlyDialog>
      <ResponsiveDialogContent className="flex h-[50vh] max-w-4xl flex-col">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Repositories</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Search your repositories or add a GitHub link (e.g., facebook/react)
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex min-h-0 w-full flex-1 flex-col space-y-4">
          <div className="relative shrink-0">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repos or paste GitHub link..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Custom repo result */}
          {customRepo && (
            <div className="shrink-0 rounded-lg border p-3">
              {customRepo.loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Fetching repository...
                </div>
              )}
              {customRepo.error && (
                <div className="text-destructive text-sm">
                  {customRepo.error}
                </div>
              )}
              {customRepo.data && (
                <div
                  onClick={() => {
                    if (customRepo.data) handleTogglePin(customRepo.data);
                  }}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md bg-muted/70 pr-2"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {customRepo.data.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {customRepo.data.owner}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isPinned(customRepo.data.id)}
                      onCheckedChange={() => {
                        if (customRepo.data) handleTogglePin(customRepo.data);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Repository list */}
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filteredRepos.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {searchQuery
                  ? "No repositories found"
                  : "No repositories available"}
              </div>
            ) : (
              filteredRepos.map((repo) => {
                const repoData: Repo = {
                  id: String(repo.id),
                  name: repo.name,
                  owner: repo.owner.login,
                  fullName: repo.fullName,
                  description: repo.description || undefined,
                  stargazersCount: repo.stargazersCount,
                  language: repo.language || undefined,
                  updatedAt: repo.updatedAt,
                };
                const pinned = isPinned(repoData.id);

                return (
                  <div
                    key={repo.id}
                    onClick={() => handleTogglePin(repoData)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md bg-muted/40 py-2 pr-4 pl-2 hover:bg-muted"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-sm">
                          {repo.name}
                        </span>
                        {repo.language && (
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {repo.owner.login}
                        </span>
                        {repo.stargazersCount > 0 && (
                          <span className="text-muted-foreground text-xs">
                            ⭐ {repo.stargazersCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={pinned}
                        onCheckedChange={() => handleTogglePin(repoData)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

/**
 * Pinned Repositories Section Component
 * Shows list of pinned repos, or suggests repos if none are pinned
 */
export function PinnedRepositories({
  pinnedReposEnriched,
  showTitle = true,
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
  showTitle?: boolean;
}) {
  const { pinnedRepos } = usePinnedRepos();
  const recentRepos = useRecentRepos(5);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Filter out already pinned repos from suggestions
  const pinnedFullNames = new Set(pinnedRepos.map((r) => r.fullName));
  const suggestedRepos = recentRepos.filter(
    (repo) => !pinnedFullNames.has(repo.fullName),
  );

  return (
    <div className="flex flex-col gap-2">
      {showTitle && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Pinned Repositories
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="size-8 shrink-0 p-0"
            title="Add repositories"
          >
            <Search className="size-4" />
          </Button>
        </div>
      )}

      {pinnedReposEnriched.length > 0 ? (
        <div className="flex flex-col gap-1">
          {pinnedReposEnriched.slice(0, 5).map((repo) => (
            <PinnedRepositoryCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : suggestedRepos.length > 0 ? (
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
      ) : (
        <div className="rounded-lg bg-muted/30 px-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            No pinned repositories. Sync your repos to see suggestions.
          </p>
        </div>
      )}

      <RepositoryPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
