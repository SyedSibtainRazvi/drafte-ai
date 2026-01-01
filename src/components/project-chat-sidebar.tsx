"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import logo from "../../public/drafte.svg";
import { ProjectChat } from "./project-chat";
import { ProjectPreviewPanel } from "./project-preview-panel";

interface ProjectChatSidebarProps {
  project: Project;
}

export function ProjectChatSidebar({ project }: ProjectChatSidebarProps) {
  const router = useRouter();
  const [localDiscovery, setLocalDiscovery] = useState<DiscoveryOutput | null>(
    null,
  );

  const discovery =
    localDiscovery ||
    (project.intentSpec as unknown as DiscoveryOutput) ||
    null;

  const handleDiscoveryDone = (discoveryData: DiscoveryOutput) => {
    setLocalDiscovery(discoveryData);
    router.refresh(); // Trigger server data refresh to get resolutionSpec
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
          <ProjectChat
            projectId={project.id}
            onDiscoveryDone={handleDiscoveryDone}
          />
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
        <ProjectPreviewPanel project={project} discovery={discovery} />
      </SidebarInset>
    </>
  );
}
