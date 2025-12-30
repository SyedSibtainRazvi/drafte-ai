"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BorderMagicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export function BorderMagicButton({
  children = "Send",
  className,
  disabled,
  ...props
}: BorderMagicButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-9 overflow-hidden rounded-full p-[1.5px] focus:outline-none",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span
        className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] rounded-full"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #E2CBFF 0%, #393BB2 50%, #E2CBFF 100%)",
        }}
      />
      <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-950 px-4 py-1.5 text-sm font-medium text-slate-950 dark:text-white backdrop-blur-3xl">
        {children}
      </span>
    </button>
  );
}
