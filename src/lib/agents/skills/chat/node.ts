// lib/agents/skills/chat/node.ts

import fs from "node:fs";
import path from "node:path";
import { ChatOpenAI } from "@langchain/openai";
import matter from "gray-matter";
import type { ProjectState } from "../../state";

const SKILL_MD_PATH = path.join(
  process.cwd(),
  "src/lib/agents/skills/chat/SKILL.md",
);

const { content: SKILL_INSTRUCTIONS } = matter(
  fs.readFileSync(SKILL_MD_PATH, "utf-8"),
);

export async function chatNode(
  state: ProjectState,
): Promise<Partial<ProjectState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    streaming: true,
  });

  /**
   * Build the prompt in this order:
   * 1. System instructions
   * 2. Last N messages from DB (history)
   * 3. Current user input
   */
  const messages = [
    {
      role: "system",
      content: SKILL_INSTRUCTIONS,
    },

    // ✅ Multi-turn context from DB (read-only)
    ...state.history.map((m) => ({
      role: m.role,
      content: m.content,
    })),

    // ✅ Current user message
    {
      role: "user",
      content: state.input,
    },
  ];

  // Invoke LLM (tokens streamed via callbacks in API route)
  await llm.invoke(messages);

  return {
    status: "AWAITING_INPUT",
    // IMPORTANT:
    // - We do NOT return messages here
    // - Streaming + persistence is handled outside the graph
  };
}
