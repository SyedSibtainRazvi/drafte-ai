export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return new Response(JSON.stringify({ error: "Missing projectId" }), {
      status: 400,
    });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return Response.json(messages);
}
