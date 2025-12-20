"use client";

import { useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/revola";
import { cn } from "@/lib/utils";

interface KeyboardShortcut {
  keys: string[];
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ["g", "h"], description: "Go to Home" },
  { keys: ["g", "i"], description: "Go to Inbox" },
  { keys: ["g", "r"], description: "Go to Repos" },
  { keys: ["g", "s"], description: "Go to Search" },
  { keys: ["g", "a"], description: "Go to Activity" },
  { keys: ["g", "o"], description: "Go to Orgs" },
  { keys: ["⌘", "K"], description: "Open search" },
  { keys: ["Shift", "?"], description: "Show keyboard shortcuts" },
];

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
  );
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onOpenChange]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} onlyDialog>
      <ResponsiveDialogContent className="max-w-2xl p-4 pb-2">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Keyboard Shortcuts</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
          <div className="py-1">
            <div className="grid gap-1">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <div key={keyIndex} className="flex items-center gap-1">
                        <Key>{key}</Key>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="text-muted-foreground">+</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

