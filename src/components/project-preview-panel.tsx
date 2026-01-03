"use client";

import {
  Layers,
  LayoutTemplate,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Project } from "@/generated/prisma/client";
import type { DiscoveryOutput } from "@/lib/agents/skills/discovery/schema";
import type {
  FooterDecisions,
  HeroDecisions,
  NavigationDecisions,
} from "@/lib/derive-variations";
import {
  deriveFooterVariations,
  deriveHeroVariations,
  deriveNavigationVariations,
} from "@/lib/derive-variations";
import { VariantSelector } from "./variant-selector";

interface ResolutionSpec {
  version: string;
  resolvedAt: string;
  components: Array<{
    componentKey: string;
    decisions: Record<string, unknown>;
  }>;
}

interface ComponentVariant {
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

interface ProjectPreviewPanelProps {
  project: Project;
  discovery: DiscoveryOutput | null;
  onSelectionComplete?: () => Promise<void>;
}

function PreviewState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "default" | "success";
}) {
  const isSuccess = variant === "success";

  return (
    <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-md flex items-center justify-center border p-6">
      <div className="text-center max-w-sm mx-auto">
        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border
            ${isSuccess
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
              : "bg-background border-border text-muted-foreground"
            }
          `}
        >
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold mb-3 tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {description}
        </p>
        {action}
      </div>
    </div>
  );
}

export function ProjectPreviewPanel({
  project,
  discovery,
  onSelectionComplete,
}: ProjectPreviewPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showResolution = searchParams.get("view") === "resolution";

  // Enable review if discovery and resolution are present
  const canReviewComponents = !!discovery && !!project.resolutionSpec;

  const handleReviewClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "resolution");
    router.push(`?${params.toString()}`);
  };

  // Prepare component variants data for VariantSelector
  const getComponentVariants = (): ComponentVariants[] => {
    if (!discovery || !project.resolutionSpec) return [];

    const resolutionSpec = project.resolutionSpec as unknown as ResolutionSpec;

    // Get components in order: navigation, hero, footer
    const components = discovery.components.sort((a, b) => {
      const order = { navigation: 0, hero: 1, footer: 2 };
      return (
        (order[a.type as keyof typeof order] ?? 99) -
        (order[b.type as keyof typeof order] ?? 99)
      );
    });

    return components.map((component) => {
      // Find the resolution decisions for this component
      const resolution = resolutionSpec.components.find(
        (c) => c.componentKey === component.type,
      );

      if (!resolution) {
        console.warn(`No resolution found for component: ${component.type}`);
        return {
          key: component.type,
          name: component.name,
          purpose: component.purpose,
          variants: [],
        };
      }

      // Derive variations based on component type
      let variants: ComponentVariant[] = [];
      switch (component.type) {
        case "navigation":
          variants = deriveNavigationVariations(
            resolution.decisions as NavigationDecisions,
          );
          break;
        case "hero":
          variants = deriveHeroVariations(
            resolution.decisions as HeroDecisions,
          );
          break;
        case "footer":
          variants = deriveFooterVariations(
            resolution.decisions as FooterDecisions,
          );
          break;
      }

      return {
        key: component.type,
        name: component.name,
        purpose: component.purpose,
        variants,
      };
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-2 pt-0 overflow-hidden min-h-0">
      {showResolution ? (
        <VariantSelector
          projectId={project.id}
          components={getComponentVariants()}
          onCompleteSuccess={onSelectionComplete}
        />
      ) : project.status === "CONTENT_GENERATED" ||
        project.status === "CONTENT_GENERATING" ? (
        <PreviewState
          icon={Sparkles}
          title="Component Selection Complete!"
          description="I've locked in your choices. Our Content Agent is now analyzing your requirements to draft personalized content for each section."
          variant="success"
        />
      ) : canReviewComponents && !showResolution ? (
        <PreviewState
          icon={Layers}
          title="Ready to Review"
          description="I've generated component options based on your requirements. Review them to proceed."
          action={
            <Button size="lg" onClick={handleReviewClick} className="px-8">
              Review & Choose Components
            </Button>
          }
        />
      ) : (
        <PreviewState
          icon={LayoutTemplate}
          title={`Project Preview`}
          description="Your generated components will appear here as we discuss and build your project."
        />
      )}
    </div>
  );
}
