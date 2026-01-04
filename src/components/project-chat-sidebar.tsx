"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { ProjectChat, ProjectChatHandle } from "./project-chat";
import { ProjectPreviewPanel } from "./project-preview-panel";

interface ProjectChatSidebarProps {
  project: Project;
}

export function ProjectChatSidebar({ project }: ProjectChatSidebarProps) {
  const router = useRouter();
  const chatRef = useRef<ProjectChatHandle>(null);
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

  const handleSelectionComplete = async () => {
    if (chatRef.current) {
      await chatRef.current.sendMessage("Draft the content");
    }
  };

  return (
    <>
      <Sidebar variant="floating">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="p-2 flex items-center justify-between w-full">
              <Image
                src={logo}
                alt="Drafte"
                width={80}
                height={80}
                priority={true}
                className="shrink-0"
              />
              <span className="font-semibold text-sm truncate max-w-[220px] text-right">
                {project.name || "Untitled Project"}
              </span>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-hidden px-2 pb-2">
          <ProjectChat
            ref={chatRef}
            projectId={project.id}
            projectStatus={project.status}
            onDiscoveryDone={handleDiscoveryDone}
            onContentDone={() => router.refresh()}
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
        <ProjectPreviewPanel
          project={project}
          discovery={discovery}
          onSelectionComplete={handleSelectionComplete}
        />
      </SidebarInset>
    </>
  );
}
