"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/theme-toggle";
import type { Project } from "@/generated/prisma/client";
import type { DiscoveryOutput } from "@/lib/agents/skills/discovery/schema";
import {
  deriveNavigationVariations,
  deriveHeroVariations,
  deriveFooterVariations,
} from "@/lib/derive-variations";
import logo from "../../public/drafte.svg";
import { ProjectChat } from "./project-chat";
import { VariantSelector } from "./variant-selector";

interface ResolutionSpec {
  version: string;
  resolvedAt: string;
  components: Array<{
    componentKey: string;
    decisions: Record<string, unknown>;
  }>;
}
import type {
  NavigationDecisions,
  HeroDecisions,
  FooterDecisions,
} from "@/lib/derive-variations";

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

interface ProjectChatSidebarProps {
  project: Project;
}

export function ProjectChatSidebar({ project }: ProjectChatSidebarProps) {
  const [discovery, setDiscovery] = useState<DiscoveryOutput | null>(null);
  const [canReviewComponents, setCanReviewComponents] = useState(false);
  const [showResolution, setShowResolution] = useState(false);

  const handleDiscoveryDone = (discoveryData: DiscoveryOutput) => {
    setDiscovery(discoveryData);
    setCanReviewComponents(true);
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
      // Note: derive functions already include the base variant as first item
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
    <>
      <Sidebar variant="floating">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="p-2 flex items-center justify-start">
              <Image
                src={logo}
                alt="Drafte"
                width={80}
                height={80}
                priority={true}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-hidden px-2 pb-2">
          <ProjectChat projectId={project.id} onDiscoveryDone={handleDiscoveryDone} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <nav className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <ModeToggle />
          </nav>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
          {showResolution ? (
            <VariantSelector
              projectId={project.id}
              components={getComponentVariants()}
            />
          ) : canReviewComponents && !showResolution ? (
            <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-md flex items-center justify-center md:min-h-min border">
              <Button
                size="lg"
                onClick={() => setShowResolution(true)}
                className="text-base px-8 py-6"
              >
                Review & Choose Components
              </Button>
            </div>
          ) : (
            <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-md flex items-center justify-center text-muted-foreground md:min-h-min border">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  Project Preview {project.name}
                </h2>
                <p>This is where your generated components will be displayed</p>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </>
  );
}
