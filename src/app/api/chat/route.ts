// app/api/chat/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createWorkflow } from "@/lib/agents/graph";
import type { ProjectState } from "@/lib/agents/state";
// import { persistEvent } from "@/lib/db/events"; // optional for now

export async function POST(req: Request) {
  const body = await req.json();
  const input: string = body.input;
  const runId: string = body.runId ?? nanoid();

  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const workflow = await createWorkflow();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

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
                const event = {
                  type: "chat_token",
                  value: token,
                };

                // persistEvent(runId, "chat_token", event); // later
                send(event);
              },
            },
          ],
        });

        send({ type: "chat_done" });
      } catch (error) {
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
      "Connection": "keep-alive",
    },
  });
}
