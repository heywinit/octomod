import { GITHUB_REPO } from "./constants";

export const description =
  "Octomod is a faster, more customizable GitHub dashboard built for developers. It uses the GitHub REST API and a sync engine to give you the information you care about without the clutter. Still in active development, fully open source.";

export const roadmap = [
  {
    id: "mvp",
    label: "MVP",
    completed: false,
    items: [
      { id: "1", label: "GitHub API integration", completed: true },
      { id: "2", label: "High-context activity feed", completed: true },
      { id: "3", label: "PR & issue inbox", completed: false },
      {
        id: "4",
        label: "Universal search across repos, PRs, and issues",
        completed: false,
      },
      {
        id: "5",
        label: "Faster file reading",
        completed: false,
      },
      {
        id: "6",
        label: "History & activity log",
        completed: false,
      },
      {
        id: "7",
        label: "Repo health alerts (CI failures, stale PRs)",
        completed: false,
      },
      {
        id: "x",
        label: <span className="text-primary">Suggest here</span>,
        completed: false,
      },
    ],
  },
] as const;

export const faqItems = [
  {
    id: "get-started",
    question: "Why?",
    answer:
      "I'm just tired of the GitHub home page and jumping through multiple links for a specific page. I tried to counter it by using direct repo URLs but I was still in need for a full proof solution.",
  },
  {
    id: "data-security",
    question: "Is my data secure?",
    answer:
      "Yes. Octomod is simply a GitHub REST API wrappers. It stores your OAuth token locally along with the sync engine's local copy of your GitHub data in your browser. Your GitHub data stays with GitHub and the device you use Octomod on.",
  },
  {
    id: "permissions",
    question: "What permissions does Octomod need?",
    answer:
      "Octomod requests read access to your repositories, issues, and pull requests. Wherever possible, Octomod asks for read access only. This is required to display your GitHub data in the dashboard. You can revoke access at any time from your GitHub settings.",
  },
  {
    id: "contribute",
    question: "Can I contribute?",
    answer: (
      <>
        Absolutely! Octomod is open source and contributors are most welcome.
        Check out the{" "}
        <a
          href={GITHUB_REPO.URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          GitHub repository
        </a>{" "}
        to get started. You can also suggest features or report bugs via{" "}
        <a
          href={GITHUB_REPO.ISSUES}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          GitHub Issues
        </a>
      </>
    ),
  },
  {
    id: "development-pace",
    question: "What's the development pace like?",
    answer:
      "I'm currently a university student with a part-time job, so most of my time is dedicated to work. I work on Octomod in my free time whenever I can, which means development progresses steadily but at a pace that fits around my other commitments. I'm committed to building this project thoughtfully.",
  },
  {
    id: "replace-github",
    question: "Will this replace GitHub?",
    answer:
      "No. Not at all. I'm in university and I barely get to work on Octomod. Octomod is a dashboard and interface layer on top of GitHub. You'll still use GitHub for git operations, code reviews, and repository management. Octomod just provides a better way to view and interact with your GitHub data.",
  },
] as const;
