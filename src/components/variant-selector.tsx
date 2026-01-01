"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  NavigationDecisions,
  HeroDecisions,
  FooterDecisions,
} from "@/lib/derive-variations";

// Import actual components
import Navigation from "@/component-library/navigation/Navigation";
import Hero from "@/component-library/hero/Hero";
import Footer from "@/component-library/footer/Footer";

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
  { id: "services", label: "Services", href: "#services", icon: "Briefcase" },
  { id: "contact", label: "Contact", href: "#contact" },
];

const SAMPLE_HERO_CONTENT = {
  title: "Build Something Amazing",
  subtitle: "Create stunning web experiences with our component library and AI-powered design system.",
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
  const handleNavigate = (link: any) => {
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
  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, number>
  >({});

  const currentComponent = components[currentComponentIndex];

  const handleVariantSelect = (componentKey: string, variantIndex: number) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [componentKey]: variantIndex,
    }));
  };

  const handleNext = () => {
    if (currentComponentIndex < components.length - 1) {
      setCurrentComponentIndex(currentComponentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentComponentIndex > 0) {
      setCurrentComponentIndex(currentComponentIndex - 1);
    }
  };

  const handleComplete = async () => {
    // TODO: Save selected variants to project
    console.log("Selected variants:", selectedVariants);
    // You can add API call here to save selections
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
          <h2 className="text-lg font-semibold capitalize">
            {currentComponent.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentComponent.purpose}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentComponentIndex + 1} of {components.length}
        </div>
      </div>

      {/* Variants Display Area - All 3 in vertical stack */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {currentComponent.variants.map((variant, index) => {
            const isSelected =
              selectedVariants[currentComponent.key] === index;

            return (
              <div
                key={index}
                onClick={() =>
                  handleVariantSelect(currentComponent.key, index)
                }
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:shadow-sm"
                  }
                `}
              >
                {/* Variant Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium">
                        {variant.label}
                      </h3>
                      {isSelected && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {variant.description}
                    </p>
                  </div>
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                </div>

                {/* Live Component Preview */}
                <ComponentRenderer
                  component={currentComponent}
                  variant={variant}
                />
              </div>
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
          <Button onClick={handleComplete} className="px-6">
            Complete Selection
          </Button>
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
