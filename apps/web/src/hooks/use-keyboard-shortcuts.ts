import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let keySequence: string[] = [];
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle g key sequences (g h, g i, etc.)
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        keySequence.push("g");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          keySequence = [];
        }, 1000);
        return;
      }

      if (keySequence.length === 1 && keySequence[0] === "g") {
        const secondKey = e.key.toLowerCase();
        clearTimeout(timeout);
        keySequence = [];

        switch (secondKey) {
          case "h":
            e.preventDefault();
            navigate({ to: "/" });
            break;
          case "i":
            e.preventDefault();
            navigate({ to: "/inbox" });
            break;
          case "r":
            e.preventDefault();
            navigate({ to: "/repos" });
            break;
          case "s":
            e.preventDefault();
            navigate({ to: "/search" });
            break;
          case "a":
            e.preventDefault();
            navigate({ to: "/activity" });
            break;
          case "o":
            e.preventDefault();
            navigate({ to: "/orgs" });
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [navigate]);
}

