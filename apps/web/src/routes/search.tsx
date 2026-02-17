import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  CircleDot,
  FileCode,
  GitPullRequest,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppDashboard } from "@/components/app-dashboard";
import { Input } from "@/components/ui/input";
import {
  parseQuery,
  type SearchResult,
  type SearchSection,
  searchGitHub,
  useLocalSearch,
} from "@/lib/search";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  repo: FileCode,
  issue: CircleDot,
  pullRequest: GitPullRequest,
  org: Building2,
};

function SearchResultCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const Icon = typeIcons[result.type] || FileCode;

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50",
        index % 2 === 0 ? "bg-card" : "bg-card/50",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{result.title}</span>
          {result.state && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 font-medium text-xs",
                result.state === "open"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : result.state === "closed"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    : result.state === "merged"
                      ? "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"
                      : "bg-muted text-muted-foreground",
              )}
            >
              {result.state}
            </span>
          )}
          {result.isDraft && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
              draft
            </span>
          )}
        </div>
        {result.description && (
          <span className="truncate text-muted-foreground text-sm">
            {result.description}
          </span>
        )}
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          {result.repo && <span>{result.repo}</span>}
          {result.timeAgo && <span>{result.timeAgo}</span>}
        </div>
      </div>
    </a>
  );
}

function SearchSectionDisplay({ section }: { section: SearchSection }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">{section.label}</h2>
        <span className="text-muted-foreground text-sm">
          ({section.results.length})
        </span>
      </div>
      <div className="grid gap-2">
        {section.results.map((result, idx) => (
          <SearchResultCard key={result.id} result={result} index={idx} />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q || "");
  const [isLoading, setIsLoading] = useState(false);
  const [githubResults, setGithubResults] = useState<SearchResult[]>([]);

  const parsedQuery = parseQuery(query);
  const localSections = useLocalSearch(parsedQuery, { limit: 20 });

  useEffect(() => {
    if (q !== query) {
      setQuery(q || "");
    }
  }, [q]);

  useEffect(() => {
    const searchGitHubResults = async () => {
      if (!query.trim() || query.trim().length < 2) {
        setGithubResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const [repos, issues, prs] = await Promise.all([
          searchGitHub(parsedQuery, "repositories"),
          searchGitHub(parsedQuery, "issues"),
          searchGitHub(parsedQuery, "pr"),
        ]);

        const existingIds = new Set(
          localSections.flatMap((s) => s.results.map((r) => r.id)),
        );

        const newResults = [...repos, ...issues, ...prs].filter(
          (r) => !existingIds.has(r.id),
        );

        setGithubResults(newResults.slice(0, 20));
      } catch (error) {
        console.error("GitHub search error:", error);
        setGithubResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchGitHubResults, 500);
    return () => clearTimeout(debounce);
  }, [query, parsedQuery, localSections]);

  const totalResults = localSections.reduce(
    (acc, s) => acc + s.results.length,
    0,
  );
  const hasResults = totalResults > 0 || githubResults.length > 0 || isLoading;

  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">Search</h1>
          <p className="text-muted-foreground">
            Search across repositories, issues, and pull requests.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for repos, issues, PRs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
          {isLoading && (
            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {!hasResults && query.trim() && (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4 font-medium text-lg">No results found</p>
            <p className="mt-1 text-sm">Try different keywords or filters</p>
          </div>
        )}

        {localSections.length > 0 && (
          <div className="flex flex-col gap-6">
            {localSections.map((section) => (
              <SearchSectionDisplay key={section.type} section={section} />
            ))}
          </div>
        )}

        {githubResults.length > 0 && (
          <div className="flex flex-col gap-6 pt-4">
            <div className="flex items-center gap-2 border-t pt-6">
              <h2 className="font-semibold">From GitHub</h2>
              <span className="text-muted-foreground text-sm">
                (not in cache)
              </span>
            </div>
            <div className="grid gap-2">
              {githubResults.map((result, idx) => (
                <SearchResultCard key={result.id} result={result} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppDashboard>
  );
}
