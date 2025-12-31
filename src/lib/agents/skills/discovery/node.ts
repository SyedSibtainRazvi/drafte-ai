// lib/agents/skills/discovery/node.ts

import fs from "node:fs";
import path from "node:path";
import { ChatOpenAI } from "@langchain/openai";
import matter from "gray-matter";
import type { ProjectState } from "../../state";
import type { DiscoveryOutput } from "./schema";
import { validateAndNormalizeDiscovery } from "./validate";

/* -------------------------------------------------
   Load Discovery Skill Instructions
-------------------------------------------------- */

const SKILL_MD_PATH = path.join(
  process.cwd(),
  "src/lib/agents/skills/discovery/SKILL.md",
);

const { content: SKILL_INSTRUCTIONS } = matter(
  fs.readFileSync(SKILL_MD_PATH, "utf-8"),
);

/* -------------------------------------------------
   Discovery Skill Node
-------------------------------------------------- */

export async function discoveryNode(
  state: ProjectState,
): Promise<Partial<ProjectState>> {
  // Use JSON mode instead of withStructuredOutput
  // This allows us to use discriminated unions in validation
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.0,
    modelKwargs: {
      response_format: { type: "json_object" },
    },
  });

  const messages = [
    { role: "system", content: SKILL_INSTRUCTIONS },

    ...state.history.map((m) => ({
      role: m.role,
      content: m.content,
    })),

    { role: "user", content: state.input },
  ];

  // Generate discovery with retry mechanism
  let rawDiscovery: unknown;
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: string | null = null;

  while (attempts < maxAttempts) {
    try {
      const retryMessages =
        attempts > 0
          ? [
              ...messages,
              {
                role: "user" as const,
                content: `Your previous JSON response was incomplete or invalid. Error: ${lastError}

CRITICAL: You MUST return a COMPLETE JSON object with ALL these required fields:
- version: "discovery_v2"
- intent: "marketing" | "portfolio" | "product" (choose based on user's request)
- theme: string (describe the website theme)
- audience: string (describe the target audience)
- layout: { type: "single-page", flow: ["Navigation", "Hero", "Footer"] }
- voice: one of the enum values or null
- persona: string or null
- components: array with exactly 3 components

Each component MUST include:
- type: "navigation" | "hero" | "footer"
- name: "Navigation" | "Hero" | "Footer" (must match type)
- purpose: string (what this component does)
- required: true
- proposal: object with component-specific fields
- reasoning: string or null
- intentHint: string or null

For hero components, also include: contentGoal (or null), ctaIntent (or null)

Return ONLY valid JSON, no markdown, no explanations.`,
              },
            ]
          : messages;

      const response = await llm.invoke(retryMessages);
      const jsonString =
        typeof response.content === "string"
          ? response.content
          : String(response.content);

      // Parse JSON
      try {
        rawDiscovery = JSON.parse(jsonString);
      } catch (parseError) {
        console.error(
          `[Discovery Skill] JSON parse error (attempt ${attempts + 1}):`,
          parseError,
        );
        throw new Error(
          `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }

      // Validate and normalize (converts to strict DiscoveryOutput)
      const discovery = validateAndNormalizeDiscovery(rawDiscovery);

      // Success - break out of retry loop
      rawDiscovery = discovery;
      break;
    } catch (error) {
      attempts++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      lastError = errorMessage;

      if (attempts >= maxAttempts) {
        console.error(
          `[Discovery Skill] Failed after ${maxAttempts} attempts:`,
          errorMessage,
        );
        throw error;
      }

      console.warn(
        `[Discovery Skill] Attempt ${attempts} failed: ${errorMessage}. Retrying...`,
      );
    }
  }

  if (!rawDiscovery) {
    throw new Error("Discovery failed after all retry attempts");
  }

  let discovery = rawDiscovery as DiscoveryOutput;

  // Ensure all components have required: true (matches backend pattern)
  discovery = {
    ...discovery,
    components: discovery.components.map((c) => ({
      ...c,
      required: true,
    })),
  };

  console.log(`[Discovery Skill] Discovery completed successfully!`);
  console.log(
    `[Discovery Skill] Final output:`,
    JSON.stringify(discovery, null, 2),
  );

  return {
    status: "DISCOVERED",
    discovery,
  };
}
