"use client";
import { ChevronDown, ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { description, faqItems, roadmap } from "./home-content";

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-screen flex-col bg-background px-8 pt-8 pb-4 md:px-6 md:pt-48">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col space-y-8 md:space-y-12">
        {/* Main content */}
        <div className="mb-4 space-y-2 md:space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-semibold text-3xl text-primary tracking-tight md:text-5xl">
              Octomod
            </h1>
          </div>
          <p
            className="text-md text-muted-foreground [font-feature-settings:'cv02','cv03','cv04','cv11'] md:text-lg"
            style={{ lineHeight: "26.25px", letterSpacing: "-0.3px" }}
          >
            {description}
          </p>

          <div className="flex items-center gap-3">
            <Button asChild className="gap-2">
              <Link href="/">Open Octomod</Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="https://github.com/heywinit/octomod" target="_blank">
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">View Source</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="roadmap" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          <TabsContent value="roadmap" className="mt-4 space-y-3">
            {roadmap.map((milestone) => (
              <div key={milestone.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={milestone.completed}
                    disabled
                    className="pointer-events-none shrink-0"
                  />
                  <h3 className="font-medium text-base text-foreground">
                    {milestone.label}
                  </h3>
                </div>
                <div className="ml-7 space-y-0">
                  {milestone.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        if (item.id === "x" || item.id === "y") {
                          window.open(
                            "https://github.com/heywinit/octomod/issues/new",
                            "_blank",
                          );
                        }
                        window.open(
                          `https://github.com/heywinit/octomod/issues/${item.id}`,
                          "_blank",
                        );
                      }}
                      className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm p-1 pr-2 pl-1.5 hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.completed}
                          disabled
                          className="pointer-events-none shrink-0"
                        />
                        <span
                          className={`text-sm ${
                            item.completed
                              ? "text-foreground/50 line-through"
                              : "text-foreground/80"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ExternalLink
                          strokeWidth={1.5}
                          className="hidden h-4 w-4 text-muted-foreground group-hover:block"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="faq" className="mt-2 px-1">
            <div className="space-y-2">
              {faqItems.map((faq) => (
                <Collapsible
                  key={faq.id}
                  className="group border-border border-b"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-2 text-left transition-colors hover:text-foreground">
                    <h3 className="font-medium text-base text-foreground">
                      {faq.question}
                    </h3>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <div className="pb-4">
                      <p className="text-foreground/80 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-auto border-border border-t pt-4">
          <div className="flex flex-col items-center justify-center gap-4 text-foreground/60 text-sm md:flex-row">
            <p className="text-foreground/40">
              Built by{" "}
              <Link
                href="https://heywinit.me"
                target="_blank"
                className="text-primary hover:underline"
              >
                heywinit
              </Link>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
