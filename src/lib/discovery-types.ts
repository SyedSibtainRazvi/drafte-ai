// Types for discovery output components
import type { ComponentProposal } from "./decision-validator";

export interface DiscoveryComponent {
  type: "navigation" | "hero" | "footer";
  name: string;
  purpose: string;
  intentHint: string | null;
  required: boolean;
  proposal: ComponentProposal;
  reasoning: string | null;
  // Content signals (hero only)
  contentGoal?:
    | "introduce-developer"
    | "highlight-product"
    | "drive-signup"
    | "build-trust"
    | "showcase-work"
    | null;
  ctaIntent?:
    | "view-work"
    | "contact"
    | "hire"
    | "learn-more"
    | "get-started"
    | null;
}

export interface DiscoveryLayout {
  type: "single-page";
  flow: string[];
}

export interface DiscoveryOutput {
  version: "discovery_v2";
  intent: "marketing" | "portfolio" | "product";
  theme: string;
  audience: string;
  voice:
    | "professional-friendly"
    | "casual-conversational"
    | "authoritative-expert"
    | "warm-personal"
    | "technical-precise"
    | null;
  persona: string | null;
  layout: DiscoveryLayout;
  components: DiscoveryComponent[];
}
