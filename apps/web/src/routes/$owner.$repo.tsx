import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  Eye,
  GitCommit,
  GitFork,
  Star,
} from "lucide-react";
import { AppDashboard } from "@/components/app-dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const Route = createFileRoute("/$owner/$repo")({
  component: RepoPage,
});

const placeholderStats = [
  { label: "Stars", value: "1.2k", icon: Star },
  { label: "Forks", value: "320", icon: GitFork },
  { label: "Watchers", value: "85", icon: Eye },
  { label: "Commits", value: "4,218", icon: GitCommit },
];

function RepoPage() {
  const { owner, repo } = Route.useParams();
  const fullName = `${owner}/${repo}`;

  return (
    <AppDashboard>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
              Repository
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {owner}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold text-2xl leading-tight">{repo}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Basic repo page placeholder — wireframe for future data from
              GitHub.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="size-4" />
              Watch
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Star className="size-4" />
              Star
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <GitFork className="size-4" />
              Fork
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5 text-muted-foreground" />
                  README preview
                </CardTitle>
                <CardDescription>
                  Use this area to surface key project details.
                </CardDescription>
              </div>
              <span className="text-muted-foreground text-xs">
                Updated just now
              </span>
            </CardHeader>
            <CardContent className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
              <p>
                Welcome to <span className="font-medium">{fullName}</span>.
                Replace this placeholder with the repository README once wired to
                GitHub.
              </p>
              <p>
                You can mirror the GitHub layout here with file navigation,
                branches, contributors, and insights. For now this is a simple
                mock to align routing and structure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick stats</CardTitle>
              <CardDescription>
                Static placeholders until GitHub data is connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {placeholderStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  <stat.icon className="size-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{stat.value}</p>
                    <p className="text-muted-foreground text-xs">{stat.label}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Repository overview</CardTitle>
              <CardDescription>
                A simple GitHub-like layout to hold upcoming data.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <CalendarClock className="size-4" />
              Updated weekly
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="code" className="w-full">
              <TabsList>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="code" className="pt-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  Show a file explorer, branches, and tags here. Use this tab to
                  mirror the GitHub code view.
                </div>
              </TabsContent>
              <TabsContent value="issues" className="pt-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  Display open issues, labels, and assignees once data is wired.
                  For now this is a placeholder list.
                </div>
              </TabsContent>
              <TabsContent value="pulls" className="pt-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  Surface pull requests and review status here.
                </div>
              </TabsContent>
              <TabsContent value="activity" className="pt-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  Recent pushes, releases, and contributors can be listed in
                  this area.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppDashboard>
  );
}
