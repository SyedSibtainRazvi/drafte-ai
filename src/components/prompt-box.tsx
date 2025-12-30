"use client";

import { useState } from "react";
import { BorderMagicButton } from "@/components/ui/border-magic-button";
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input";

export function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, _setIsLoading] = useState(false);

  const handleSubmit = async () => {};

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
