"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

import type { FooterProps } from "./footer.types";
import { containerClasses, paddingClasses } from "./footer.utils";

export default function Footer({
  alignment,
  layout,
  density,
  showCopyright,
  links = [],
  copyright,
  onNavigate,
  interactionMode = "interactive",
}: FooterProps) {
  const handleClick = (
    e: React.MouseEvent,
    link: { name: string; href: string },
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onNavigate?.(link);
  };

  const alignmentClass =
    alignment === "center"
      ? "items-center text-center"
      : alignment === "right"
        ? "items-end text-right"
        : "items-start text-left";

  return (
    <footer className={cn(containerClasses(), paddingClasses(density))}>
      <div className="mx-auto max-w-7xl px-4">
        <div className={cn("flex flex-col gap-3", alignmentClass)}>
          {/* Links layout */}
          {layout === "links" && links.length > 0 && (
            <nav className="flex flex-wrap gap-6">
              {links.map((link) => (
                <button
                  key={link.name}
                  type="button"
                  onClick={(e) => handleClick(e, link)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </nav>
          )}

          {/* Text / copyright */}
          {showCopyright && (
            <p className="text-xs text-muted-foreground">
              {copyright ||
                `© ${new Date().getFullYear()} All rights reserved.`}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
