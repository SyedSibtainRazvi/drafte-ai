import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await req.json();
    const { selections } = body;

    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: "Invalid selections" },
        { status: 400 },
      );
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Use a transaction to delete existing components and create new ones
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing components for this project
      await tx.projectComponent.deleteMany({
        where: { projectId },
      });

      // 2. Create new ProjectComponent records
      // We need to generate valid UUIDs for PostgreSQL @db.Uuid fields
      // Since prisma-client is using db.Uuid, we must provide 36-char UUIDs
      const projectComponents = selections.map((selection, index) => {
        return tx.projectComponent.create({
          data: {
            id: crypto.randomUUID(), // Valid UUID for Postgres
            projectId: projectId,
            componentKey: selection.key,
            position: index,
            decisions: selection.decisions,
            updatedAt: new Date(),
          },
        });
      });

      await Promise.all(projectComponents);

      // 3. Update project status
      await tx.project.update({
        where: { id: projectId },
        data: {
          status: "CONTENT_GENERATED", // Or another appropriate status
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROJECT_RESOLVE_POST]", error);
    return NextResponse.json(
      { error: "Failed to resolve components" },
      { status: 500 },
    );
  }
}
