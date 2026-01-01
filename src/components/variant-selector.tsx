"use client";

import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Footer from "@/component-library/footer/Footer";
import Hero from "@/component-library/hero/Hero";

// Import actual components
import Navigation from "@/component-library/navigation/Navigation";
import { Button } from "@/components/ui/button";
import type {
  FooterDecisions,
  HeroDecisions,
  NavigationDecisions,
} from "@/lib/derive-variations";

export interface ComponentVariant {
  label: string;
  description: string;
  decisions: NavigationDecisions | HeroDecisions | FooterDecisions;
}

interface ComponentVariants {
  key: string;
  name: string;
  purpose: string;
  variants: ComponentVariant[];
}

interface VariantSelectorProps {
  projectId: string;
  components: ComponentVariants[];
}

// Sample content data for component previews
const SAMPLE_NAVIGATION_LINKS = [
  { id: "home", label: "Home", href: "#home" },
  { id: "about", label: "About", href: "#about" },
  { id: "services", label: "Services", href: "#services" },
  { id: "contact", label: "Contact", href: "#contact" },
];

const SAMPLE_HERO_CONTENT = {
  title: "Build Something Amazing",
  subtitle:
    "Create stunning web experiences with our component library and AI-powered design system.",
  image: "/api/placeholder/600/400",
  ctaPrimary: "Get Started",
  ctaSecondary: "Learn More",
};

const SAMPLE_FOOTER_CONTENT = {
  links: [
    { name: "Privacy", href: "#privacy" },
    { name: "Terms", href: "#terms" },
    { name: "Support", href: "#support" },
  ],
  copyright: "© 2024 Your Company. All rights reserved.",
};

function ComponentRenderer({
  component,
  variant,
}: {
  component: ComponentVariants;
  variant: ComponentVariant;
}) {
  const handleNavigate = (link: unknown) => {
    console.log("Navigation:", link);
  };

  switch (component.key) {
    case "navigation":
      return (
        <div className="border rounded-lg p-4 bg-background">
          <Navigation
            {...(variant.decisions as NavigationDecisions)}
            primaryLinks={SAMPLE_NAVIGATION_LINKS}
            onNavigate={handleNavigate}
            interactionMode="preview"
          />
        </div>
      );

    case "hero":
      return (
        <div className="border rounded-lg p-4 bg-background min-h-[300px]">
          <Hero
            {...(variant.decisions as HeroDecisions)}
            {...SAMPLE_HERO_CONTENT}
            onNavigate={handleNavigate}
            interactionMode="preview"
          />
        </div>
      );

    case "footer":
      return (
        <div className="border rounded-lg p-4 bg-background">
          <Footer
            {...(variant.decisions as FooterDecisions)}
            {...SAMPLE_FOOTER_CONTENT}
            onNavigate={handleNavigate}
            interactionMode="preview"
          />
        </div>
      );

    default:
      return (
        <div className="border rounded-lg p-4 bg-muted">
          <p className="text-sm text-muted-foreground">
            Component renderer not implemented for: {component.key}
          </p>
        </div>
      );
  }
}

export function VariantSelector({
  projectId,
  components,
}: VariantSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive index from URL (?step=0)
  const stepParam = searchParams.get("step");
  const currentComponentIndex = stepParam ? parseInt(stepParam, 10) : 0;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, number>
  >(() => Object.fromEntries(components.map((c) => [c.key, 0])));

  const currentComponent = components[currentComponentIndex];

  const updateStep = (newIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", newIndex.toString());
    router.push(`?${params.toString()}`);
  };

  const handleVariantSelect = (componentKey: string, variantIndex: number) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [componentKey]: variantIndex,
    }));
  };

  const handleNext = () => {
    if (currentComponentIndex < components.length - 1) {
      updateStep(currentComponentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentComponentIndex > 0) {
      updateStep(currentComponentIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const selections = components.map((comp) => {
        const variantIndex = selectedVariants[comp.key] ?? 0;
        const variant = comp.variants[variantIndex];
        return {
          key: comp.key,
          decisions: variant.decisions,
        };
      });

      const res = await fetch(`/api/projects/${projectId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });

      if (!res.ok) {
        throw new Error("Failed to save components");
      }

      // Success! Clear search params and show new state
      console.log("Components saved successfully!");
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setSaveError("An error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading component variants...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-md border">
      {/* Component Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold capitalize tracking-tight">
            {currentComponent.name}
          </h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentComponentIndex + 1} of {components.length}
        </div>
      </div>

      {/* Variants Display Area - All 3 in vertical stack */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col gap-8 w-full">
          {currentComponent.variants.map((variant, index) => {
            const isSelected = selectedVariants[currentComponent.key] === index;

            return (
              <label
                key={`${currentComponent.key}-${variant.label}`}
                className={`
                  relative border-2 rounded-lg p-4 cursor-pointer transition-all w-full block
                  focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500
                  ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md"
                      : "border-border hover:border-emerald-500/50 hover:shadow-sm"
                  }
                `}
              >
                <input
                  type="radio"
                  name={`variant-${currentComponent.key}`}
                  value={index}
                  checked={isSelected}
                  onChange={() =>
                    handleVariantSelect(currentComponent.key, index)
                  }
                  className="sr-only"
                  aria-label={`Select ${variant.label}`}
                />
                {/* Variant Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {variant.label}
                      </h3>
                      {index === 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px] font-medium uppercase tracking-wider border border-violet-200 dark:border-violet-800">
                          <Sparkles className="w-3 h-3" />
                          AI Recommended
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-4
                      ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/30 bg-transparent"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 bg-current rounded-full" />
                    )}
                  </div>
                </div>

                {/* Live Component Preview - Forced Full Width */}
                <div className="relative w-full overflow-x-hidden pointer-events-none">
                  <ComponentRenderer
                    component={currentComponent}
                    variant={variant}
                  />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t p-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentComponentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {currentComponentIndex === components.length - 1 ? (
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleComplete}
              className="px-6 relative"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Complete Selection"
              )}
            </Button>
            {saveError && (
              <span className="text-xs text-destructive font-medium">
                {saveError}
              </span>
            )}
          </div>
        ) : (
          <Button onClick={handleNext} className="px-6">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
