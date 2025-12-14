import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Octomod",
  description:
    "A faster, more customizable GitHub dashboard built for developers. Open source alternative to GitHub's default dashboard with better UX and developer-focused features.",
  keywords: [
    "GitHub",
    "dashboard",
    "developer tools",
    "open source",
    "developer dashboard",
  ],
  openGraph: {
    title: "Octomod",
    description:
      "A faster, more customizable GitHub dashboard built for developers.",
    type: "website",
    url: "https://octomod.xyz",
  },
  twitter: {
    card: "summary",
    title: "Octomod",
    description:
      "A faster, more customizable GitHub dashboard built for developers.",
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={inter.variable}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      {children}
    </div>
  );
}
