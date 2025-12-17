import { createFileRoute } from "@tanstack/react-router";


import { ChevronDown, ExternalLink, Github } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { description, faqItems, roadmap } from "@/lib/home-content";

export const Route = createFileRoute("/")({
	component: HomePage,
});


function HomePage() {
  const roadmapTabRef = useRef<HTMLButtonElement>(null);
  const faqTabRef = useRef<HTMLButtonElement>(null);
  const [tabValue, setTabValue] = useState("roadmap");

  const handleTabChange = (value: string) => {
    if (value !== "source") {
      setTabValue(value);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Check for modifier keys - we want single key presses only
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v":
          e.preventDefault();
          window.open("https://github.com/heywinit/octomod", "_blank");
          break;
        case "r":
          e.preventDefault();
          roadmapTabRef.current?.click();
          break;
        case "f":
          e.preventDefault();
          faqTabRef.current?.click();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <div className="flex min-h-screen w-screen flex-col bg-background px-6 pt-12 pb-4 md:px-8 md:pt-48">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col space-y-12 md:space-y-16">
        {/* Main content */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-semibold text-3xl text-primary tracking-tight md:text-5xl">
              Octomod
            </h1>
          </div>
          <p className="text-lg text-muted-foreground leading-snug">
            {description}
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="roadmap"
          className="w-full"
          value={tabValue}
          onValueChange={handleTabChange}
        >
          <TabsList className="w-full justify-between">
            <div className="flex items-center gap-1">
              <TabsTrigger
                value="roadmap"
                ref={roadmapTabRef}
                className="px-2.5 md:pr-1.5 md:pl-2"
              >
                Roadmap
                <kbd className="pointer-events-none ml-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:inline-flex">
                  <span className="text-xs">R</span>
                </kbd>
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                ref={faqTabRef}
                className="px-2.5 md:pr-1.5 md:pl-2"
              >
                FAQ
                <kbd className="pointer-events-none ml-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:inline-flex">
                  <span className="text-xs">F</span>
                </kbd>
              </TabsTrigger>
            </div>
            <div className="flex items-center gap-4">
              <TabsTrigger
                value="source"
                className="h-min gap-2 bg-background/50 pr-1.5 pl-2"
              >
                <a
                  href="https://github.com/heywinit/octomod"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <Github className="mr-1 size-4" />
                  <span className="">
                    <span className="hidden sm:inline">View</span> Source
                  </span>
                  <kbd className="pointer-events-none mr-0 ml-1 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100 sm:inline-flex">
                    <span className="text-xs">V</span>
                  </kbd>
                </a>
              </TabsTrigger>
            </div>
          </TabsList>
          <TabsContent value="roadmap" className="mt-6 space-y-6">
            {roadmap.map((milestone) => (
              <div key={milestone.id} className="space-y-1">
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
                  {milestone.items.map((item) => {
                    const href =
                      item.id === "x"
                        ? "https://github.com/heywinit/octomod/issues/new"
                        : `https://github.com/heywinit/octomod/issues/${item.id}`;
                    return (
                      <a
                        key={item.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm p-2 pr-3 pl-2.5 text-left hover:bg-accent/50"
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
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="faq" className="mt-6 px-1">
            <div className="space-y-2">
              {faqItems.map((faq) => (
                <Collapsible
                  key={faq.id}
                  className="group border-border border-b"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-2.5 text-left transition-colors hover:text-foreground">
                    <h3 className="font-medium text-base text-foreground">
                      {faq.question}
                    </h3>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <div className="pb-6">
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
          <div className="flex flex-col items-center justify-center gap-2 text-foreground/60 text-sm md:flex-row">
            <p className="text-foreground/40">
              Built by{" "}
              <a
                href="https://heywinit.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                heywinit
              </a>
            </p>
            <span className="hidden text-foreground/40 md:inline">•</span>
            <p className="text-foreground/40">MIT License</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
