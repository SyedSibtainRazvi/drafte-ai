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
- "chat" → greetings, vague questions, help, or follow-ups

Respond with ONLY one word:
"chat" or "discovery"

User message:
"${state.input}"
`;

  const result = await llm.invoke(prompt);

  const content =
    typeof result.content === "string"
      ? result.content.trim().toLowerCase()
      : "";

  const selectedSkill: SelectedSkill =
    content === "discovery" ? "discovery" : "chat";
  console.log("[ROUTER] selectedSkill:", selectedSkill);

  return { selectedSkill };
}
