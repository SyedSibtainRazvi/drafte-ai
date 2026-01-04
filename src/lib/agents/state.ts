/**
 * LangGraph State (Chat-only v1)
 *
 * Canonical state for chat execution.
 * UI messages are NOT stored here.
 * Messages are derived from persisted events.
 */

import { Annotation } from "@langchain/langgraph";
import type { SelectedSkill } from "./router/types";
import type { ContentOutput } from "./skills/content/schema";
import type { DiscoveryOutput } from "./skills/discovery/schema";

export const ProjectStateAnnotation = Annotation.Root({
  // Unique run / conversation ID
  runId: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => "",
  }),

  // Latest user input
  input: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => "",
  }),

  // Minimal lifecycle status
  status: Annotation<
    "IDLE" | "STREAMING" | "AWAITING_INPUT" | "FAILED" | "DISCOVERED"
  >({
    reducer: (_x, y) => y ?? "AWAITING_INPUT",
    default: () => "AWAITING_INPUT",
  }),

  history: Annotation<{ role: "user" | "assistant"; content: string }[]>({
    reducer: (_x, y) => y ?? [],
    default: () => [],
  }),

  discovery: Annotation<DiscoveryOutput | null>({
    reducer: (_x, y) => y ?? null,
    default: () => null,
  }),

  content: Annotation<ContentOutput | null>({
    reducer: (_x, y) => y ?? null,
    default: () => null,
  }),

  selectedSkill: Annotation<SelectedSkill | null>({
    reducer: (_x, y) => y ?? null,
    default: () => null,
  }),
});

export type ProjectState = typeof ProjectStateAnnotation.State;
