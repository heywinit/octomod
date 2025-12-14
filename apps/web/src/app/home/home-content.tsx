import Link from "next/link";

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
        label: "Fast indexed data (no slow GitHub pages)",
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
  {
    id: "post-mvp",
    label: "Post-MVP",
    completed: false,
    items: [
      {
        id: "y",
        label: <span className="text-primary">Suggest here</span>,
        completed: false,
      },
    ],
  },
] as const;

export const faqItems = [
  {
    id: "get-started",
    question: "How do I get started?",
    answer:
      'Click "Open Octomod" above to launch the app. You\'ll need to authenticate with your GitHub account to get started. No installation required.',
  },
  {
    id: "data-security",
    question: "Is my data secure?",
    answer:
      "Yes. Octomod only uses GitHub's official REST API and stores your OAuth token locally in your browser. We don't store any of your data on our servers. Your GitHub data stays with GitHub.",
  },
  {
    id: "permissions",
    question: "What permissions does Octomod need?",
    answer:
      "Octomod requests read access to your repositories, issues, and pull requests. This is required to display your GitHub data in the dashboard. You can revoke access at any time from your GitHub settings.",
  },
  {
    id: "contribute",
    question: "Can I contribute?",
    answer: (
      <>
        Absolutely! Octomod is open source and we welcome contributions. Check
        out the{" "}
        <Link
          href="https://github.com/heywinit/octomod"
          target="_blank"
          className="text-primary hover:underline"
        >
          GitHub repository
        </Link>{" "}
        to get started. You can also suggest features or report bugs via GitHub
        Issues.
      </>
    ),
  },
  {
    id: "replace-github",
    question: "Will this replace GitHub?",
    answer:
      "No. Octomod is a dashboard and interface layer on top of GitHub. You'll still use GitHub for git operations, code reviews, and repository management. Octomod just provides a better way to view and interact with your GitHub data.",
  },
] as const;
