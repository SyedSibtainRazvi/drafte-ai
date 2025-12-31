/**
 * LangGraph State (Chat-only v1)
 *
 * Canonical state for chat execution.
 * UI messages are NOT stored here.
 * Messages are derived from persisted events.
 */

import { Annotation } from "@langchain/langgraph";

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
  status: Annotation<"IDLE" | "STREAMING" | "AWAITING_INPUT" | "FAILED">({
    reducer: (_x, y) => y ?? "AWAITING_INPUT",
    default: () => "AWAITING_INPUT",
  }),
});

export type ProjectState = typeof ProjectStateAnnotation.State;
