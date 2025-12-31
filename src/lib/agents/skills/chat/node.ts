// lib/agents/skills/chat/node.ts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { ChatOpenAI } from "@langchain/openai";
import type { ProjectState } from "../../state";

const SKILL_MD_PATH = path.join(
  process.cwd(),
  "src/lib/agents/skills/chat/SKILL.md"
);

const { content: SKILL_INSTRUCTIONS } = matter(
  fs.readFileSync(SKILL_MD_PATH, "utf-8")
);

export async function chatNode(
  state: ProjectState
): Promise<Partial<ProjectState>> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    streaming: true,
  });

  const response = await llm.invoke([
    { role: "system", content: SKILL_INSTRUCTIONS },
    { role: "user", content: state.input },
  ]);

  return {
    status: "AWAITING_INPUT",
    // NOTE: we do NOT store messages in state
    // The content will be streamed via callbacks instead
  };
}
