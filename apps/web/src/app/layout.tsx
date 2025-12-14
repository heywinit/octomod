import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "@/index.css";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
      <Analytics />
    </html>
  );
}
