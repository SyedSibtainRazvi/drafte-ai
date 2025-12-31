/**
 * Discovery Skill Schema
 *
 * Defines the output schema for the discovery skill
 * Only uses navigation, hero, and footer components
 */

import { z } from "zod";

/* ────────────────────────────────────────────────
   ENUMS
──────────────────────────────────────────────── */

const IntentEnum = z.enum(["marketing", "portfolio", "product"]);

/* ────────────────────────────────────────────────
   SCHEMAS
──────────────────────────────────────────────── */

// Component decision proposal schemas
// Matches Navigation.meta.ts decisionSchema
export const NavigationProposalSchema = z.object({
  alignment: z.enum(["left", "center", "right"]),
  density: z.enum(["compact", "comfortable"]),
  background: z.enum(["solid", "transparent", "blur"]),
});

// Matches Hero.meta.ts decisionSchema
export const HeroProposalSchema = z.object({
  alignment: z.enum(["left", "center", "right"]),
  layout: z.enum(["text-only", "split"]),
  density: z.enum(["compact", "comfortable"]),
  cta: z.enum(["none", "single", "dual"]),
  background: z.enum(["solid", "transparent"]),
});

// Matches Footer.meta.ts decisionSchema
export const FooterProposalSchema = z.object({
  alignment: z.enum(["left", "center", "right"]),
  layout: z.enum(["text", "links"]),
  density: z.enum(["compact", "comfortable"]),
  showCopyright: z.boolean(),
});

// Component schemas with type-specific proposals
// Using discriminated union to ensure proper validation
const NavigationComponentSchema = z.object({
  type: z.literal("navigation"),
  name: z.string(),
  purpose: z.string(),
  intentHint: z.string().nullable(),
  required: z.boolean(),
  proposal: NavigationProposalSchema,
  reasoning: z.string().nullable(),
});

const HeroComponentSchema = z.object({
  type: z.literal("hero"),
  name: z.string(),
  purpose: z.string(),
  intentHint: z.string().nullable(),
  required: z.boolean(),
  proposal: HeroProposalSchema,
  reasoning: z.string().nullable(),
  // Content generation signals
  contentGoal: z
    .enum([
      "introduce-developer",
      "highlight-product",
      "drive-signup",
      "build-trust",
      "showcase-work",
    ])
    .nullable(),
  ctaIntent: z
    .enum(["view-work", "contact", "hire", "learn-more", "get-started"])
    .nullable(),
});

const FooterComponentSchema = z.object({
  type: z.literal("footer"),
  name: z.string(),
  purpose: z.string(),
  intentHint: z.string().nullable(),
  required: z.boolean(),
  proposal: FooterProposalSchema,
  reasoning: z.string().nullable(),
});

// Discriminated union ensures type-specific proposal validation
const ComponentSchema = z.discriminatedUnion("type", [
  NavigationComponentSchema,
  HeroComponentSchema,
  FooterComponentSchema,
]);

const LayoutSchema = z.object({
  type: z.literal("single-page"),
  flow: z.array(z.string()).nonempty(),
});

export const DiscoveryOutputSchema = z.object({
  version: z.literal("discovery_v2"),
  intent: IntentEnum,
  theme: z.string(),
  audience: z.string(),
  // Content generation signals (project-level)
  voice: z
    .enum([
      "professional-friendly",
      "casual-conversational",
      "authoritative-expert",
      "warm-personal",
      "technical-precise",
    ])
    .nullable(),
  persona: z.string().nullable(), // e.g., "frontend developer with 3 years experience"
  layout: LayoutSchema,
  components: z.array(ComponentSchema),
});

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;
