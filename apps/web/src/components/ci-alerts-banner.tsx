"use client";

import { ChevronDown, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { CIAlert } from "@/lib/sync";

/**
 * CI/CD Alerts Banner Component
 * Sticky, collapsible, only shows if alerts exist
 */
export function CIAlertsBanner({ alerts }: { alerts: CIAlert[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const visibleAlerts = alerts.slice(0, 3);

  if (alerts.length === 0) {
    return null;
  }

  const failureCount = alerts.filter(
    (a) => a.status === "failure" || a.status === "error",
  ).length;
  const warningCount = alerts.filter((a) => a.status === "warning").length;

  return (
    <div className="sticky top-0 z-10 mb-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "rounded-lg bg-muted/50 p-3",
            failureCount > 0 && "bg-red-500/10",
            failureCount === 0 && warningCount > 0 && "bg-yellow-500/10",
          )}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle
                className={cn(
                  "size-4",
                  failureCount > 0 && "text-red-500",
                  failureCount === 0 && warningCount > 0 && "text-yellow-500",
                )}
              />
              <span className="text-sm font-medium">
                CI failing in {failureCount} repo{alerts.length !== 1 ? "s" : ""}
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
            <div className="mt-2 flex flex-col gap-2">
              {visibleAlerts.map((alert) => (
                <a
                  key={alert.id}
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded bg-background/50 px-2 py-1.5 text-sm transition-colors hover:bg-background/80"
                >
                  <span className="font-medium">{alert.repository}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground">{alert.branch}</span>
                  <span className="text-muted-foreground">({alert.workflow})</span>
                </a>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}



