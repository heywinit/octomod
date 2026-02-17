"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CircleDot,
  Command,
  FileCode,
  GitPullRequest,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  getAllResults,
  parseQuery,
  type SearchResult,
  type SearchSection,
  searchGitHub,
  useLocalSearch,
  useRecentSearches,
} from "@/lib/search";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  repo: FileCode,
  issue: CircleDot,
  pullRequest: GitPullRequest,
  org: Building2,
  command: Command,
};

function SearchResultItem({
  result,
  isSelected,
  onClick,
  itemRef,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  itemRef: React.MutableRefObject<HTMLButtonElement | null>;
}) {
  const Icon = typeIcons[result.type] || FileCode;
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && buttonRef.current) {
      itemRef.current = buttonRef.current;
    }
  }, [isSelected, itemRef]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
      onClick={onClick}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{result.title}</span>
        {result.description && (
          <span className="truncate text-muted-foreground text-xs">
            {result.description}
          </span>
        )}
      </div>
      {result.timeAgo && (
        <span className="text-muted-foreground text-xs">{result.timeAgo}</span>
      )}
    </button>
  );
}

function SearchSectionGroup({
  section,
  selectedIndex,
  startIndex,
  onSelect,
  itemRef,
}: {
  section: SearchSection;
  selectedIndex: number;
  startIndex: number;
  onSelect: (result: SearchResult) => void;
  itemRef: React.MutableRefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 font-medium text-muted-foreground text-xs">
        <span>{section.label}</span>
        <span className="text-[10px]">({section.results.length})</span>
      </div>
      <div className="flex flex-col px-1">
        {section.results.map((result, idx) => (
          <SearchResultItem
            key={result.id}
            result={result}
            isSelected={selectedIndex === startIndex + idx}
            onClick={() => onSelect(result)}
            itemRef={itemRef}
          />
        ))}
      </div>
    </div>
  );
}

export function SearchPopover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [githubResults, setGithubResults] = useState<SearchResult[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const parsedQuery = useMemo(() => parseQuery(searchQuery), [searchQuery]);
  const sections = useLocalSearch(parsedQuery, { limit: 8 });
  const localResults = useMemo(() => getAllResults(sections), [sections]);
  const allResults = useMemo(
    () => [...localResults, ...githubResults],
    [localResults, githubResults],
  );
  const { searches: recentSearches, addSearch } = useRecentSearches();

  // Fetch GitHub results when query changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setGithubResults([]);
      setIsLoadingGithub(false);
      return;
    }

    let cancelled = false;

    const fetchGithub = async () => {
      setIsLoadingGithub(true);
      try {
        const [repos, issues, prs] = await Promise.all([
          searchGitHub(parsedQuery, "repositories"),
          searchGitHub(parsedQuery, "issues"),
          searchGitHub(parsedQuery, "pr"),
        ]);

        if (cancelled) return;

        setGithubResults([...repos, ...issues, ...prs].slice(0, 10));
      } catch (e) {
        console.error("GitHub search error:", e);
        if (!cancelled) setGithubResults([]);
      } finally {
        if (!cancelled) setIsLoadingGithub(false);
      }
    };

    const debounce = setTimeout(fetchGithub, 400);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [searchQuery, parsedQuery]);

  const isShowingRecent =
    searchQuery.trim() === "" && recentSearches.length > 0;
  const totalResults = isShowingRecent
    ? Math.min(recentSearches.length, 5)
    : allResults.length;

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (searchQuery.trim()) {
        addSearch(searchQuery);
      }
      if (result.url) {
        if (result.url.startsWith("http")) {
          window.open(result.url, "_blank");
        } else {
          navigate({ to: result.url });
        }
        setIsOpen(false);
        setSearchQuery("");
      }
    },
    [navigate, searchQuery, addSearch],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalResults);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isShowingRecent) {
          const search = recentSearches[selectedIndex];
          if (search) {
            setSearchQuery(search.query);
          }
        } else if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    selectedIndex,
    totalResults,
    allResults,
    handleSelect,
    isShowingRecent,
    recentSearches,
  ]);

  let currentIndex = 0;

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search or jump to..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && !isOpen) {
                  setIsOpen(true);
                }
              }}
              onFocus={() => setIsOpen(true)}
              className={cn("w-full pr-20 pl-9")}
            />
            <kbd className="pointer-events-none absolute top-1/2 right-3 z-10 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="mt-1 max-h-[500px] w-full max-w-2xl overflow-y-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            width: containerRef.current?.offsetWidth,
          }}
        >
          {searchQuery.trim() === "" && recentSearches.length > 0 ? (
            <div className="flex flex-col py-2">
              <div className="flex items-center gap-2 px-3 py-1.5 font-medium text-muted-foreground text-xs">
                <span>Recent Searches</span>
              </div>
              {recentSearches.slice(0, 5).map((search, idx) => (
                <button
                  key={search.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedIndex === idx
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                  onClick={() => setSearchQuery(search.query)}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{search.query}</span>
                </button>
              ))}
            </div>
          ) : totalResults === 0 && !isLoadingGithub ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <p className="mt-1 text-xs">
                Try searching for repos, issues, or PRs
              </p>
            </div>
          ) : (
            <div className="flex flex-col py-2">
              {sections.map((section) => {
                const startIndex = currentIndex;
                currentIndex += section.results.length;

                return (
                  <SearchSectionGroup
                    key={section.type}
                    section={section}
                    selectedIndex={selectedIndex}
                    startIndex={startIndex}
                    onSelect={handleSelect}
                    itemRef={selectedItemRef}
                  />
                );
              })}

              {/* GitHub Results */}
              {githubResults.length > 0 && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-1.5 font-medium text-blue-500 text-xs">
                    <span>From GitHub</span>
                    <span className="text-[10px]">
                      ({githubResults.length})
                    </span>
                  </div>
                  <div className="flex flex-col px-1">
                    {githubResults.map((result) => {
                      const startIndex = currentIndex;
                      currentIndex++;
                      return (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          isSelected={selectedIndex === startIndex}
                          onClick={() => handleSelect(result)}
                          itemRef={selectedItemRef}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {isLoadingGithub && (
                <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching GitHub...</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  ↵
                </kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  esc
                </kbd>
                <span>Close</span>
              </span>
            </div>
            {searchQuery.trim() && (
              <button
                type="button"
                className="flex items-center gap-1 text-foreground hover:underline"
                onClick={() => {
                  navigate({ to: "/search", search: { q: searchQuery } });
                  setIsOpen(false);
                }}
              >
                <span>Full search</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
