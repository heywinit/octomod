/**
 * Rate Limit Manager
 * Tracks GitHub API rate limits and controls fetch scheduling
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type RateLimitState,
  type FetchJob,
  type FetchPriority,
  FetchPriority as Priority,
  DEFAULT_SYNC_CONFIG,
} from "./types";

interface RateLimitStore {
  rateLimit: RateLimitState;
  updateRateLimit: (remaining: number, limit: number, resetAt: number) => void;
  canFetch: (priority: FetchPriority) => boolean;
  getTimeUntilReset: () => number;
  isRateLimited: () => boolean;
}

export const useRateLimitStore = create<RateLimitStore>()(
  persist(
    (set, get) => ({
      rateLimit: {
        remaining: 5000, // GitHub default
        limit: 5000,
        resetAt: 0,
        lastUpdatedAt: 0,
      },

      updateRateLimit: (remaining: number, limit: number, resetAt: number) => {
        set({
          rateLimit: {
            remaining,
            limit,
            resetAt,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      canFetch: (priority: FetchPriority) => {
        const { rateLimit } = get();
        const now = Date.now();

        // If reset time has passed, assume we have full limit
        if (rateLimit.resetAt > 0 && now > rateLimit.resetAt * 1000) {
          return true;
        }

        // CRITICAL always goes through unless we're at 0
        if (priority === Priority.CRITICAL) {
          return rateLimit.remaining > 0;
        }

        // HIGH can go if we're above critical threshold
        if (priority === Priority.HIGH) {
          return rateLimit.remaining > DEFAULT_SYNC_CONFIG.rateLimitCriticalThreshold;
        }

        // NORMAL and LOW need safe threshold
        return rateLimit.remaining > DEFAULT_SYNC_CONFIG.rateLimitSafeThreshold;
      },

      getTimeUntilReset: () => {
        const { rateLimit } = get();
        const now = Date.now();
        const resetTime = rateLimit.resetAt * 1000;
        return Math.max(0, resetTime - now);
      },

      isRateLimited: () => {
        const { rateLimit } = get();
        const now = Date.now();

        // If reset time has passed, we're not rate limited
        if (rateLimit.resetAt > 0 && now > rateLimit.resetAt * 1000) {
          return false;
        }

        return rateLimit.remaining <= DEFAULT_SYNC_CONFIG.rateLimitCriticalThreshold;
      },
    }),
    {
      name: "octomod-rate-limit",
    }
  )
);

/**
 * Fetch Queue - Priority-based job scheduler
 */
interface FetchQueueState {
  queue: FetchJob[];
  isProcessing: boolean;
  addJob: (job: Omit<FetchJob, "id" | "retries" | "createdAt">) => string;
  removeJob: (jobId: string) => void;
  processNext: () => Promise<void>;
  startProcessing: () => void;
  stopProcessing: () => void;
  clearQueue: () => void;
  getQueueLength: () => number;
}

let jobIdCounter = 0;
let processingInterval: ReturnType<typeof setInterval> | null = null;

export const useFetchQueue = create<FetchQueueState>((set, get) => ({
  queue: [],
  isProcessing: false,

  addJob: (job) => {
    const id = `job-${Date.now()}-${++jobIdCounter}`;
    const fullJob: FetchJob = {
      ...job,
      id,
      retries: 0,
      createdAt: Date.now(),
    };

    set((state) => {
      // Insert in priority order
      const newQueue = [...state.queue, fullJob].sort(
        (a, b) => a.priority - b.priority
      );
      return { queue: newQueue };
    });

    // Trigger processing if not already running
    const { isProcessing, startProcessing } = get();
    if (!isProcessing) {
      startProcessing();
    }

    return id;
  },

  removeJob: (jobId) => {
    set((state) => ({
      queue: state.queue.filter((j) => j.id !== jobId),
    }));
  },

  processNext: async () => {
    const { queue } = get();
    if (queue.length === 0) return;

    const job = queue[0];
    const rateLimitStore = useRateLimitStore.getState();

    // Check if we can fetch based on priority
    if (!rateLimitStore.canFetch(job.priority)) {
      // If rate limited, check when we can retry
      const timeUntilReset = rateLimitStore.getTimeUntilReset();
      if (timeUntilReset > 0) {
        console.log(
          `[Sync] Rate limited, waiting ${Math.ceil(timeUntilReset / 1000)}s`
        );
        return;
      }
    }

    // Remove job from queue before executing
    set((state) => ({
      queue: state.queue.slice(1),
    }));

    try {
      await job.execute();
    } catch (error) {
      console.error(`[Sync] Job ${job.id} failed:`, error);

      // Retry with exponential backoff
      if (job.retries < DEFAULT_SYNC_CONFIG.maxRetries) {
        const retryDelay =
          DEFAULT_SYNC_CONFIG.retryBaseDelay * Math.pow(2, job.retries);

        setTimeout(() => {
          set((state) => ({
            queue: [
              ...state.queue,
              { ...job, retries: job.retries + 1 },
            ].sort((a, b) => a.priority - b.priority),
          }));
        }, retryDelay);
      }
    }
  },

  startProcessing: () => {
    set({ isProcessing: true });

    // Process queue every 100ms
    if (processingInterval) {
      clearInterval(processingInterval);
    }

    processingInterval = setInterval(() => {
      const { queue, processNext, stopProcessing } = get();
      if (queue.length === 0) {
        stopProcessing();
        return;
      }
      processNext();
    }, 100);
  },

  stopProcessing: () => {
    if (processingInterval) {
      clearInterval(processingInterval);
      processingInterval = null;
    }
    set({ isProcessing: false });
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  getQueueLength: () => get().queue.length,
}));

