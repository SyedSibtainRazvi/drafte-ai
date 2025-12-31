export const runtime = "nodejs";

import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createWorkflow } from "@/lib/agents/graph";
import type { ProjectState } from "@/lib/agents/state";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const input: string = body.input;
  const runId: string = body.runId ?? nanoid();

  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  await prisma.chatMessage.create({
    data: {
      projectId: runId,
      role: "user",
      content: input,
    },
  });

  const workflow = await createWorkflow();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      type ChatEvent =
        | { type: "chat_token"; value: string }
        | { type: "chat_done" }
        | { type: "error"; message: string };

      const send = (event: ChatEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      let assistantText = "";

      try {
        const initialState: ProjectState = {
          runId,
          input,
          status: "STREAMING",
        };

        await workflow.invoke(initialState, {
          callbacks: [
            {
              handleLLMNewToken(token) {
                assistantText += token;
                send({
                  type: "chat_token",
                  value: token,
                });
              },
            },
          ],
        });

        await prisma.chatMessage.create({
          data: {
            projectId: runId,
            role: "assistant",
            content: assistantText,
          },
        });

        send({ type: "chat_done" });
      } catch (error) {
        console.error("Chat error:", error);
        send({
          type: "error",
          message: "Something went wrong",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
