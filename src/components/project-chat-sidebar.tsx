"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
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
import logo from "../../public/drafte.svg";
import { ProjectChat } from "./project-chat";

interface ProjectChatSidebarProps {
  project: Project;
}

export function ProjectChatSidebar({ project }: ProjectChatSidebarProps) {
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
          <ProjectChat projectId={project.id} />
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
          <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-md flex items-center justify-center text-muted-foreground md:min-h-min border">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Project Preview {project.name}
              </h2>
              <p>This is where your generated components will be displayed</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
