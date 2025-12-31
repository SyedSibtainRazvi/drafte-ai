import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectChatSidebar } from "@/components/project-chat-sidebar";
import type { Project } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

// Force dynamic rendering because:
// 1. We use auth() which requires per-request execution
// 2. We check user authorization (project ownership)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { prompt: true, name: true },
    });

    if (!project) {
      return {
        title: "Project Not Found",
      };
    }

    return {
      title: project.name || "Project",
      description: project.prompt.slice(0, 160),
    };
  } catch {
    return {
      title: "Project",
    };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  let project: Project | null;
  try {
    project = await prisma.project.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    notFound();
  }

  if (!project) {
    notFound();
  }

  if (project.userId !== userId) {
    notFound();
  }

  return <ProjectChatSidebar project={project} />;
}
