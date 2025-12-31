/**
 * Chat-only LangGraph
 *
 * START → runChat → END
 */

import { END, StateGraph } from "@langchain/langgraph";
import { chatNode } from "@/lib/agents/skills/chat/node";
import { ProjectStateAnnotation } from "./state";

export async function createWorkflow() {
  const graph = new StateGraph(ProjectStateAnnotation)
    .addNode("runChat", chatNode)
    .addEdge("__start__", "runChat")
    .addEdge("runChat", END);

  return graph.compile();
}

export { END };
