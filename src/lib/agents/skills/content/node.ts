import fs from "node:fs";
import path from "node:path";
import { ChatOpenAI } from "@langchain/openai";
import matter from "gray-matter";
import { prisma } from "@/lib/prisma";
import type { ProjectState } from "../../state";
import { type ContentOutput, ContentOutputSchema } from "./schema";
import { getActiveContentFields } from "./utils";

/* -------------------------------------------------
   Load Content Skill Instructions
-------------------------------------------------- */

const SKILL_MD_PATH = path.join(
  process.cwd(),
  "src/lib/agents/skills/content/SKILL.md",
);

const { content: SKILL_INSTRUCTIONS } = matter(
  fs.readFileSync(SKILL_MD_PATH, "utf-8"),
);

/* -------------------------------------------------
   Content Skill Node
-------------------------------------------------- */

export async function contentNode(
  state: ProjectState,
): Promise<Partial<ProjectState>> {
  const projectId = state.runId;

  // 1. Fetch project + components (persistence only)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ProjectComponent: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const components = project.ProjectComponent;
  if (components.length === 0) {
    console.log("[Content Skill] No components found.");
    return { status: "AWAITING_INPUT" };
  }

  // 2. Prepare component requirements
  const componentRequirements = components.map((comp) => ({
    componentKey: comp.componentKey,
    activeFields: getActiveContentFields(
      comp.componentKey,
      (comp.decisions as Record<string, any>) || {},
    ),
    decisions: comp.decisions,
  }));

  // 3. Setup LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    modelKwargs: {
      response_format: { type: "json_object" },
    },
  });

  // IMPORTANT: Use LangGraph state, not DB
  const discovery = state.discovery;

  // Filter flow for navigation links (exclude Nav/Footer/Header)
  const validLinkTargets =
    discovery?.layout?.flow?.filter(
      (item: string) => !["Navigation", "Footer", "Header"].includes(item),
    ) || [];

  const prompt = `
YOU ARE DRAFTING CONTENT FOR THE FOLLOWING COMPONENTS:
${JSON.stringify(componentRequirements, null, 2)}

PROJECT CONTEXT:
- Name: ${project.name || "Untitled Project"}
- Goals: ${project.prompt}
- Audience: ${discovery?.audience || "General"}
- Voice: ${discovery?.voice || "Professional"}
- Persona: ${discovery?.persona || "None"}
- Valid Navigation Targets: ${JSON.stringify(validLinkTargets)}

INSTRUCTIONS:
- Write content ONLY for the listed "activeFields"
- Do NOT introduce new fields
- Return JSON matching ContentOutputSchema
- For Navigation 'primaryLinks', ONLY generate links for the "Valid Navigation Targets" listed above. Do not link to Navigation or Footer.
`;

  const messages = [
    { role: "system", content: SKILL_INSTRUCTIONS },
    { role: "user", content: prompt },
  ];

  const response = await llm.invoke(messages);

  const jsonString =
    typeof response.content === "string"
      ? response.content
      : String(response.content);

  const parsed = ContentOutputSchema.safeParse(JSON.parse(jsonString));

  if (!parsed.success) {
    console.error("[Content Skill] Invalid LLM output", parsed.error);
    throw new Error("Invalid ContentOutput from LLM");
  }

  const output: ContentOutput = parsed.data;

  // 4. Persistence: Update DB
  console.log(
    `[Content Skill] Persisting content for ${output.components.length} components...`,
  );

  await Promise.all(
    output.components.map((item) =>
      prisma.projectComponent.updateMany({
        where: {
          projectId,
          componentKey: item.componentKey,
        },
        data: {
          content: item.content,
          updatedAt: new Date(),
        },
      }),
    ),
  );

  // 5. Update Project Status
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "CONTENT_GENERATED",
      updatedAt: new Date(),
    },
  });

  console.log("[Content Skill] Content generation complete & saved.");

  return {
    content: output,
    status: "AWAITING_INPUT",
  };
}
