import { END, StateGraph } from "@langchain/langgraph";
import { routerNode } from "./router/node";
import { chatNode } from "./skills/chat/node";
import { discoveryNode } from "./skills/discovery/node";
import { ProjectStateAnnotation } from "./state";

export async function createWorkflow() {
  const graph = new StateGraph(ProjectStateAnnotation)
    .addNode("router", routerNode)
    .addNode("chat", chatNode)
    .addNode("runDiscovery", discoveryNode)

    .addEdge("__start__", "router")

    .addConditionalEdges("router", (state) => state.selectedSkill ?? "chat", {
      chat: "chat",
      discovery: "runDiscovery",
    })

    .addEdge("chat", END)
    .addEdge("runDiscovery", END);

  return graph.compile();
}
