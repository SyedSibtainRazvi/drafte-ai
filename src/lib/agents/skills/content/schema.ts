import { z } from "zod";

export const ComponentContentSchema = z.object({
  componentKey: z
    .string()
    .describe("The key of the component (e.g., 'hero', 'footer')"),

  content: z
    .record(z.string(), z.any())
    .describe(
      "Human-readable content fields (e.g., { title: 'Hello', links: [...] })",
    ),
});

export const ContentOutputSchema = z.object({
  version: z.literal("content_v1"),

  components: z
    .array(ComponentContentSchema)
    .describe("List of generated content for each project component"),

  global: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    })
    .optional()
    .describe("Global style hints generated during content creation"),
});

export type ContentOutput = z.infer<typeof ContentOutputSchema>;
export type ComponentContent = z.infer<typeof ComponentContentSchema>;
