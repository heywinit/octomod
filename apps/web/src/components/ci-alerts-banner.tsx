"use client";

import { AlertCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CIAlert } from "@/lib/sync";
import { cn } from "@/lib/utils";

/**
 * CI/CD Alerts Banner Component
 * Sticky, collapsible, only shows if alerts exist
 */
export function CIAlertsBanner({ alerts }: { alerts: CIAlert[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const visibleAlerts = alerts.slice(0, 5);

  if (alerts.length === 0) {
    return null;
  }

  const failureCount = alerts.filter(
    (a) => a.status === "failure" || a.status === "error",
  ).length;

  return (
    <div className="sticky top-0 z-10 mb-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-red-500" />
              <span className="font-medium text-red-600 text-sm dark:text-red-400">
                {failureCount} failing
                {failureCount !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 flex flex-col gap-1.5">
              {visibleAlerts.map((alert) => (
                <a
                  key={alert.id}
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border border-border/50 bg-card px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{alert.repository}</span>
                  <span className="text-muted-foreground">{alert.branch}</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {alert.workflow}
                  </span>
                </a>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
