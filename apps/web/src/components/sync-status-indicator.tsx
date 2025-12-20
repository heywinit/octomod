"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/dashboard.service";

interface SyncStatusIndicatorProps {
  syncStatus: string;
  lastSyncAt?: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Sync Status Indicator
 */
export function SyncStatusIndicator({
  syncStatus,
  lastSyncAt,
  onRefresh,
  isRefreshing,
}: SyncStatusIndicatorProps) {
  const getStatusText = () => {
    switch (syncStatus) {
      case "syncing":
        return "Syncing...";
      case "rate-limited":
        return "Rate limited";
      case "offline":
        return "Offline";
      case "error":
        return "Sync error";
      default:
        return lastSyncAt
          ? `Updated ${formatTimeAgo(new Date(lastSyncAt))}`
          : "Ready";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{getStatusText()}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing || syncStatus === "syncing"}
        className="h-7 w-7 p-0"
      >
        <RefreshCw
          className={cn("size-3.5", isRefreshing && "animate-spin")}
        />
      </Button>
    </div>
  );
}


