export type SearchResultType =
  | "repo"
  | "issue"
  | "pullRequest"
  | "org"
  | "command"
  | "user";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  url?: string;
  icon?: string;
  repo?: string;
  number?: number;
  labels?: Array<{ name: string; color: string }>;
  state?: "open" | "closed" | "merged";
  isDraft?: boolean;
  isReviewRequested?: boolean;
  isAssignedToYou?: boolean;
  timeAgo?: string;
}

export interface ParsedQuery {
  raw: string;
  typeFilter: SearchResultType | null;
  filters: SearchFilters;
  searchTerms: string[];
}

export interface SearchFilters {
  isOpen?: boolean;
  isClosed?: boolean;
  isAssigned?: boolean;
  isReviewRequested?: boolean;
  isAuthor?: boolean;
  isDraft?: boolean;
  isFailing?: boolean;
  label?: string;
  language?: string;
}

export interface SearchOptions {
  limit?: number;
  includeCommands?: boolean;
  includeUsers?: boolean;
}

export interface SearchSection {
  type: SearchResultType;
  label: string;
  results: SearchResult[];
}

export const QUICK_COMMANDS: SearchResult[] = [
  {
    id: "cmd-settings",
    type: "command",
    title: "Settings",
    description: "Go to settings",
    url: "/settings",
    icon: "⚙️",
  },
  {
    id: "cmd-inbox",
    type: "command",
    title: "Inbox",
    description: "View your notifications",
    url: "/inbox",
    icon: "📥",
  },
  {
    id: "cmd-activity",
    type: "command",
    title: "Activity",
    description: "View recent activity",
    url: "/activity",
    icon: "📊",
  },
  {
    id: "cmd-repos",
    type: "command",
    title: "Repositories",
    description: "Browse all repositories",
    url: "/repos",
    icon: "📦",
  },
  {
    id: "cmd-orgs",
    type: "command",
    title: "Organizations",
    description: "View your organizations",
    url: "/orgs",
    icon: "🏢",
  },
  {
    id: "cmd-search",
    type: "command",
    title: "Advanced Search",
    description: "Open full search page",
    url: "/search",
    icon: "🔍",
  },
];

export function parseQuery(query: string): ParsedQuery {
  const trimmed = query.trim().toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);

  let typeFilter: SearchResultType | null = null;
  const filters: SearchFilters = {};
  const searchTerms: string[] = [];

  for (const word of words) {
    if (word.startsWith("repo:")) {
      typeFilter = "repo";
      const term = word.slice(5);
      if (term) searchTerms.push(term);
    } else if (word.startsWith("issue:")) {
      typeFilter = "issue";
      const term = word.slice(6);
      if (term) searchTerms.push(term);
    } else if (word.startsWith("pr:") || word.startsWith("pull:")) {
      typeFilter = "pullRequest";
      const term = word.slice(3);
      if (term) searchTerms.push(term);
    } else if (word.startsWith("org:")) {
      typeFilter = "org";
      const term = word.slice(4);
      if (term) searchTerms.push(term);
    } else if (word === "is:open") {
      filters.isOpen = true;
    } else if (word === "is:closed") {
      filters.isClosed = true;
    } else if (word === "is:assigned") {
      filters.isAssigned = true;
    } else if (word === "is:review" || word === "is:reviewing") {
      filters.isReviewRequested = true;
    } else if (word === "is:author" || word === "is:mine") {
      filters.isAuthor = true;
    } else if (word === "is:draft") {
      filters.isDraft = true;
    } else if (word === "is:failing" || word === "is:failure") {
      filters.isFailing = true;
    } else if (word.startsWith("label:")) {
      filters.label = word.slice(6);
    } else if (word.startsWith("lang:") || word.startsWith("language:")) {
      filters.language = word.startsWith("language:")
        ? word.slice(9)
        : word.slice(5);
    } else if (word.startsWith("#") && /^\d+$/.test(word.slice(1))) {
      searchTerms.push(word.slice(1));
    } else if (!word.startsWith("/")) {
      searchTerms.push(word);
    }
  }

  return {
    raw: query,
    typeFilter,
    filters,
    searchTerms,
  };
}

export function matchesSearch(text: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const lower = text.toLowerCase();
  return terms.every((term) => lower.includes(term));
}
