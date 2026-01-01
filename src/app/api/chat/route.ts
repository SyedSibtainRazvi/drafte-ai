export const runtime = "nodejs";

import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createWorkflow } from "@/lib/agents/graph";
import type { DiscoveryOutput } from "@/lib/agents/skills/discovery/schema";
import type { ProjectState } from "@/lib/agents/state";
import { decisionValidator } from "@/lib/decision-validator";
import type { DiscoveryComponent } from "@/lib/discovery-types";
import { prisma } from "@/lib/prisma";

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

          // Check if resolution spec already exists to avoid re-processing
          const existingProject = await prisma.project.findUnique({
            where: { id: runId },
            select: { resolutionSpec: true },
          });

          if (!existingProject?.resolutionSpec) {
            console.log(`[API] Creating resolution spec for project ${runId}`);

            // Reset validator for this project
            decisionValidator.reset();

            const validatedComponents: Array<{
              componentKey: string;
              decisions: Record<string, unknown> | null;
              position: number;
              contentSignals?: Record<string, unknown>;
            }> = [];

            for (let i = 0; i < finalState.discovery.components.length; i++) {
              const planned = finalState.discovery.components[
                i
              ] as DiscoveryComponent;
              const validation = decisionValidator.validateDecisions({
                name: planned.name,
                type: planned.type,
                proposal: planned.proposal,
                intentHint: planned.intentHint || undefined,
                reasoning: planned.reasoning || undefined,
                contentGoal: planned.contentGoal || undefined,
                ctaIntent: planned.ctaIntent || undefined,
              });

              if (!validation.valid) {
                throw new Error(
                  `Invalid decisions for ${planned.name} (${planned.type}): ${validation.errors?.join(", ")}`,
                );
              }

              // Extract content generation signals
              const contentSignals: Record<string, unknown> = {};
              if (planned.contentGoal) {
                contentSignals.contentGoal = planned.contentGoal;
              }
              if (planned.ctaIntent) {
                contentSignals.ctaIntent = planned.ctaIntent;
              }

              // Store in ProjectComponent
              if (validation.componentKey) {
                await prisma.projectComponent.create({
                  data: {
                    id: crypto.randomUUID(),
                    projectId: runId,
                    componentKey: validation.componentKey,
                    decisions: validation.decisions
                      ? (validation.decisions as any)
                      : undefined,
                    position: i,
                    selected: true,
                    meta:
                      Object.keys(contentSignals).length > 0
                        ? (contentSignals as any)
                        : undefined,
                    updatedAt: new Date(),
                  },
                });

                validatedComponents.push({
                  componentKey: validation.componentKey,
                  decisions: validation.decisions || null,
                  position: i,
                  ...(Object.keys(contentSignals).length > 0 && {
                    contentSignals,
                  }),
                });
              }

              console.log(
                `   ✅ ${planned.name} (${planned.type}) → decisions validated and stored`,
              );
            }

            // Store resolution spec for backward compatibility
            const resolutionSpec = {
              version: "v2",
              resolvedAt: new Date().toISOString(),
              // Project-level content signals
              ...(finalState.discovery.voice && {
                voice: finalState.discovery.voice,
              }),
              ...(finalState.discovery.persona && {
                persona: finalState.discovery.persona,
              }),
              components: validatedComponents.map((v) => ({
                componentKey: v.componentKey,
                decisions: v.decisions,
                ...(v.contentSignals && { contentSignals: v.contentSignals }),
              })),
            };

            await prisma.project.update({
              where: { id: runId },
              data: {
                resolutionSpec: resolutionSpec as any,
                resolutionSpecVersion: "v2",
                status: "CONTENT_GENERATING",
                updatedAt: new Date(),
              },
            });

            console.log(
              `[API] Resolution spec created and stored for project ${runId}`,
            );
          } else {
            console.log(
              `[API] Resolution spec already exists for project ${runId}, skipping creation`,
            );
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
