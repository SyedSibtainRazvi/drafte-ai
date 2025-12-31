"use client";

import type * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroProps } from "./hero.types";
import {
  alignmentClasses,
  containerClasses,
  paddingClasses,
  splitLayoutClasses,
  textClasses,
} from "./hero.utils";

/**
 * Premium Hero Component
 * Fully responsive and decision-driven architecture.
 * Production-grade with smooth interactions and hover effects.
 */
export default function Hero({
  alignment,
  layout,
  density,
  cta,
  background,
  title,
  subtitle,
  image,
  ctaPrimary,
  ctaSecondary,
  onNavigate,
  interactionMode = "interactive",
}: HeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isPreview = interactionMode === "preview";

  // Center alignment with split layout = no image (text-only behavior)
  // Left/Right alignment with split layout = text + image side-by-side
  const effectiveLayout =
    alignment === "center" && layout === "split" ? "text-only" : layout;
  const shouldShowImage = effectiveLayout === "split" && alignment !== "center";

  const handleCTAClick = (
    e: React.MouseEvent,
    type: "cta-primary" | "cta-secondary",
    label: string,
  ) => {
    if (isPreview) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onNavigate?.({
      type,
      label,
    });
  };

  const renderCTA = () => {
    if (cta === "none") return null;

    // Don't render CTA container if no buttons to show
    const hasPrimary = ctaPrimary && (cta === "single" || cta === "dual");
    const hasSecondary = cta === "dual" && ctaSecondary;

    if (!hasPrimary && !hasSecondary) return null;

    return (
      <div
        className={cn(
          "flex flex-wrap gap-4 pt-4",
          alignment === "center"
            ? "justify-center"
            : alignment === "right"
              ? "justify-end"
              : "justify-start",
        )}
      >
        {hasPrimary && (
          <Button
            size="lg"
            onClick={(e) => handleCTAClick(e, "cta-primary", ctaPrimary!)}
            aria-disabled={isPreview}
            className={cn(
              "rounded-full px-8 font-semibold",
              "bg-black text-white",
              "transition-all duration-300",
              "hover:bg-gray-800 hover:scale-105 hover:shadow-lg",
              "active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isPreview && "opacity-50 cursor-not-allowed",
            )}
          >
            {ctaPrimary}
          </Button>
        )}
        {hasSecondary && (
          <Button
            variant="outline"
            size="lg"
            onClick={(e) => handleCTAClick(e, "cta-secondary", ctaSecondary!)}
            aria-disabled={isPreview}
            className={cn(
              "rounded-full px-8 font-semibold whitespace-nowrap",
              "border-black text-black",
              "transition-all duration-300",
              "hover:bg-black hover:text-white hover:scale-105 hover:shadow-md",
              "active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isPreview && "opacity-50 cursor-not-allowed",
            )}
          >
            {ctaSecondary}
          </Button>
        )}
      </div>
    );
  };

  const ContentGroup = (
    <div className={cn(textClasses(), "group", "w-full")}>
      <h1
        className={cn(
          "text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]",
          "bg-clip-text text-transparent bg-linear-to-br from-foreground to-foreground/70",
          "transition-all duration-500",
          "group-hover:from-foreground group-hover:to-foreground/90",
          alignment === "right" && "text-right",
          alignment === "left" && "text-left",
          alignment === "center" && "text-center",
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className={cn(
            "text-lg md:text-xl lg:text-2xl leading-relaxed",
            "transition-colors duration-300",
            "text-muted-foreground",
            "group-hover:text-foreground/80",
            alignment === "center" && "max-w-2xl mx-auto text-center",
            alignment === "left" && "max-w-2xl text-left",
            alignment === "right" && "max-w-2xl text-right ml-auto",
          )}
        >
          {subtitle}
        </p>
      )}

      {renderCTA()}
    </div>
  );

  return (
    <section className={containerClasses(background)} aria-label="Hero section">
      <div
        className={cn(
          "container relative z-20 mx-auto",
          paddingClasses(density),
        )}
      >
        {shouldShowImage ? (
          <div className={splitLayoutClasses()}>
            {/* Text content - left alignment = text left, right alignment = text right */}
            <div
              className={cn(
                alignment === "right" ? "lg:order-2" : "lg:order-1",
                "transition-opacity duration-500",
              )}
            >
              {ContentGroup}
            </div>

            {/* Image content - left alignment = image right, right alignment = image left */}
            <div
              className={cn(
                "relative flex justify-center",
                alignment === "right" ? "lg:order-1" : "lg:order-2",
              )}
            >
              {image ? (
                <div
                  className={cn(
                    "relative w-full aspect-4/3 lg:aspect-square group",
                    "transition-all duration-500",
                    !isPreview && "hover:scale-[1.02]",
                  )}
                >
                  {/* Hover glow effect */}
                  {!isPreview && (
                    <div
                      className={cn(
                        "absolute -inset-4 bg-linear-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-2xl",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-500",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  {!imageLoaded && !imageError && (
                    <div
                      className="absolute inset-0 bg-muted animate-pulse rounded-2xl"
                      aria-hidden="true"
                    />
                  )}
                  <img
                    src={image}
                    alt={subtitle || title}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={cn(
                      "relative w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10 dark:border-white/10",
                      "transition-all duration-500",
                      !imageLoaded && "opacity-0",
                      imageLoaded && "opacity-100",
                      !isPreview &&
                        "group-hover:shadow-3xl group-hover:border-white/20 dark:group-hover:border-white/20",
                    )}
                    loading="lazy"
                  />
                </div>
              ) : (
                // Placeholder when image is missing in split layout
                <div
                  className={cn(
                    "relative w-full aspect-4/3 lg:aspect-square",
                    "bg-muted/50 rounded-2xl border border-dashed border-muted-foreground/20",
                    "flex items-center justify-center",
                  )}
                >
                  <p className="text-sm text-muted-foreground">
                    Image placeholder
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Text-only layout (center alignment or explicit text-only)
          <div className={alignmentClasses(alignment)}>{ContentGroup}</div>
        )}
      </div>
    </section>
  );
}
