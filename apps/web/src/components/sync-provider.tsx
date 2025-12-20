"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { getSyncOrchestrator, destroySyncOrchestrator } from "@/lib/sync";

/**
 * SyncProvider
 * Initializes the sync engine when the user is authenticated
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      destroySyncOrchestrator();
      return;
    }

    // Initialize the sync engine
    const orchestrator = getSyncOrchestrator();
    orchestrator.initialize({
      onSyncComplete: () => {
        console.log("[SyncProvider] Initial sync complete");
      },
    });

    return () => {
      // Cleanup on logout
    };
  }, [isAuthenticated, token]);

  return <>{children}</>;
}

