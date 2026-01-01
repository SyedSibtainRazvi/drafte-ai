export const runtime = "nodejs";

import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createWorkflow } from "@/lib/agents/graph";
import type { DiscoveryOutput } from "@/lib/agents/skills/discovery/schema";
import type { ProjectState } from "@/lib/agents/state";
import { prisma } from "@/lib/prisma";
import { resolutionService } from "@/lib/resolution-service";

export async function POST(req: Request) {
  const body = await req.json();
  const input: string = body.input;
  const runId: string = body.runId ?? nanoid();
  const HISTORY_LIMIT = 6;

  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  // 1. Fetch latest history BEFORE saving the current message
  const historyFromDb = await prisma.chatMessage.findMany({
    where: { projectId: runId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  // 2. Detect if this is an automated re-send of the initial prompt
  // (Happens during the after-redirect auto-start)
  const isDuplicateOfInitial =
    historyFromDb.length > 0 &&
    historyFromDb[0].role === "user" &&
    historyFromDb[0].content === input;

  if (!isDuplicateOfInitial) {
    // ONLY save if it's a NEW message from the user
    await prisma.chatMessage.create({
      data: {
        projectId: runId,
        role: "user",
        content: input,
      },
    });
  }

  // Reverse to chronological order (asc) for the LLM
  // If it's a duplicate, we still want the history to look correct
  const conversationHistory = [...historyFromDb].reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const workflow = await createWorkflow();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      type ChatEvent =
        | { type: "chat_token"; value: string }
        | { type: "chat_done" }
        | { type: "discovery_done"; value: DiscoveryOutput }
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
          history: conversationHistory,
          discovery: null,
          selectedSkill: null,
        };

        const finalState = await workflow.invoke(initialState, {
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

        // 3. Handle Discovery Output
        // Save intentSpec if the workflow generated or updated discovery data
        if (finalState.discovery) {
          console.log(`[API] Saving discovery intentSpec for project ${runId}`);

          // Serialize for Prisma Json field
          const intentSpecData = JSON.parse(
            JSON.stringify(finalState.discovery),
          );

          await prisma.project.update({
            where: { id: runId },
            data: {
              prompt: input.trim(), // Update the main project prompt with the discovery-triggering input
              intentSpec: intentSpecData,
              intentSpecVersion: "discovery_v2",
              status: "DISCOVERED",
              updatedAt: new Date(),
            },
          });

          // Create resolution spec using the service
          const resolutionResult = await resolutionService.createResolutionSpec(
            runId,
            finalState.discovery,
          );

          if (!resolutionResult.success) {
            console.error(
              `[API] Resolution spec creation failed: ${resolutionResult.message}`,
            );
            // Continue with the request even if resolution fails
            // The discovery data is still saved in intentSpec
          }

          // Special event for the frontend to update its local state/preview
          if (finalState.selectedSkill === "discovery") {
            send({
              type: "discovery_done",
              value: finalState.discovery,
            });

            if (!assistantText) {
              assistantText =
                "I've analyzed your requirements and created a plan! You can see the components in the preview area.";
            }
          }
        }

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
