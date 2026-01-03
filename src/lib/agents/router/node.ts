// lib/agents/router/node.ts

import { ChatOpenAI } from "@langchain/openai";
import type { ProjectState } from "../state";
import type { SelectedSkill } from "./types";

export async function routerNode(
  state: ProjectState,
): Promise<{ selectedSkill: SelectedSkill }> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const prompt = `
You are an intent router.

Classify the user's message into ONE of the following:

- "discovery" → user wants to build, create, design, or plan a website
- "content" → user wants to write, draft, generate, or update copy for components
- "chat" → greetings, vague questions, or general conversation

Respond with ONLY one word:
"chat", "discovery", or "content"

User message:
"${state.input}"
`;

  const result = await llm.invoke(prompt);

  const content =
    typeof result.content === "string"
      ? result.content.trim().toLowerCase()
      : "";

  let selectedSkill: SelectedSkill = "chat";
  if (content.includes("discovery")) selectedSkill = "discovery";
  else if (content.includes("content")) selectedSkill = "content";

  if (selectedSkill === "content" && !state.discovery) {
    console.log("[ROUTER] Content requested without discovery, redirecting");
    selectedSkill = "discovery";
  }

  console.log("[ROUTER] selectedSkill:", selectedSkill);
  return { selectedSkill };
}
