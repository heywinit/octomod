"use client";

import {
  ResponsiveCommandDialog,
  ResponsiveCommandEmpty,
  ResponsiveCommandGroup,
  ResponsiveCommandInput,
  ResponsiveCommandItem,
  ResponsiveCommandList,
  ResponsiveCommandShortcut,
  useCommandK,
} from "@/components/ui/responsive-command";

export default function Home() {
  const { open, setOpen } = useCommandK();

  return (
    <>
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>{" "}
          to open the command palette
        </p>
      </div>

      <ResponsiveCommandDialog open={open} onOpenChange={setOpen}>
        <ResponsiveCommandInput placeholder="Type a command or search..." />
        <ResponsiveCommandList>
          <ResponsiveCommandEmpty>No results found.</ResponsiveCommandEmpty>
          <ResponsiveCommandGroup heading="Suggestions">
            <ResponsiveCommandItem>Calendar</ResponsiveCommandItem>
            <ResponsiveCommandItem>Search Emoji</ResponsiveCommandItem>
            <ResponsiveCommandItem>Calculator</ResponsiveCommandItem>
          </ResponsiveCommandGroup>
          <ResponsiveCommandGroup heading="Settings">
            <ResponsiveCommandItem>
              <span>Profile</span>
              <ResponsiveCommandShortcut>⌘P</ResponsiveCommandShortcut>
            </ResponsiveCommandItem>
            <ResponsiveCommandItem>
              <span>Billing</span>
              <ResponsiveCommandShortcut>⌘B</ResponsiveCommandShortcut>
            </ResponsiveCommandItem>
            <ResponsiveCommandItem>
              <span>Settings</span>
              <ResponsiveCommandShortcut>⌘S</ResponsiveCommandShortcut>
            </ResponsiveCommandItem>
          </ResponsiveCommandGroup>
        </ResponsiveCommandList>
      </ResponsiveCommandDialog>
    </>
  );
}
