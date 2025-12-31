"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BorderMagicButton } from "@/components/ui/border-magic-button";
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input";

const PENDING_PROMPT_KEY = "drafte_pending_prompt";

export function PromptBox() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitProject = useCallback(
    async (promptToSubmit: string) => {
      if (!isSignedIn) {
        try {
          localStorage.setItem(PENDING_PROMPT_KEY, promptToSubmit);
        } catch (error) {
          console.error("Failed to save pending prompt:", error);
        }
        router.push("/sign-up");
        return;
      }

      if (!promptToSubmit.trim()) return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: promptToSubmit }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Failed to create project. Please try again.",
          );
        }

        const project = await response.json();
        try {
          localStorage.removeItem(PENDING_PROMPT_KEY);
        } catch (error) {
          console.error("Failed to remove pending prompt:", error);
        }
        router.push(`/projects/${project.id}`);
      } catch (error) {
        console.error("Error creating project:", error);
        // TODO: Add toast notification or error state display
        // For now, we'll just log the error
        alert(
          error instanceof Error
            ? error.message
            : "Failed to create project. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn, router],
  );

  const handleSubmit = () => {
    submitProject(prompt);
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);
      if (pendingPrompt) {
        submitProject(pendingPrompt);
      }
    }
  }, [isLoaded, isSignedIn, submitProject]);

  return (
    <div className="mt-12 max-w-2xl mx-auto space-y-4">
      <PromptInput
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        disabled={isLoading}
        maxHeight={128}
        className="
        relative
        w-full
        bg-muted
        border
        border-border
        rounded-md
        shadow
        focus-within:ring-1
        focus-within:ring-ring
        overflow-hidden
        overflow-x-hidden
        flex flex-col
      "
      >
        <div className="flex-1 min-h-[160px]">
          <PromptInputTextarea
            placeholder="Describe what you want to build…"
            className="
          h-full
          px-4
          py-3
          bg-transparent
          dark:bg-transparent
          resize-none
          overflow-y-auto
          overflow-x-hidden
          text-md
          md:text-md
          placeholder:text-md
          placeholder:md:text-md
          wrap-break-word
          whitespace-pre-wrap
        "
          />
        </div>
        <div className="flex justify-end px-2 pb-2">
          <BorderMagicButton
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
          />
        </div>
      </PromptInput>
    </div>
  );
}
