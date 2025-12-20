"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth";

export function FeedbackPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [includeExtraInfo, setIncludeExtraInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);

    const feedbackData: {
      feedback: string;
      includeExtraInfo: boolean;
      extraInfo?: {
        page: string;
        userAgent: string;
        timestamp: string;
        userId?: string;
        username?: string;
      };
    } = {
      feedback: feedback.trim(),
      includeExtraInfo,
    };

    if (includeExtraInfo) {
      feedbackData.extraInfo = {
        page: location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...(user && {
          userId: user.id.toString(),
          username: user.login,
        }),
      };
    }

    try {
      // TODO: Replace with actual API endpoint
      console.log("Submitting feedback:", feedbackData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reset form
      setFeedback("");
      setIsOpen(false);

      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Send feedback"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Feedback</p>
          <Textarea
            ref={textareaRef}
            placeholder="Send feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none text-sm"
          />

          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-extra-info"
                    checked={includeExtraInfo}
                    onCheckedChange={(checked) =>
                      setIncludeExtraInfo(checked === true)
                    }
                  />
                  <Label
                    htmlFor="include-extra-info"
                    className="text-xs cursor-pointer text-muted-foreground"
                  >
                    Include analytics
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="flex flex-col gap-1 text-xs">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Current page ({location.pathname})</li>
                    <li>Browser info</li>
                    {user && (
                      <>
                        <li>User ID ({user.id})</li>
                        <li>Username (@{user.login})</li>
                      </>
                    )}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="h-7 px-3 text-xs"
            >
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

