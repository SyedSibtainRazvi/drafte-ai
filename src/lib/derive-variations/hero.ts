/**
 * Hero Variation Engine (v1)
 *
 * Rules:
 * - Base variant is always first (Discovery Recommended)
 * - Change only ONE decision per variant
 * - Derive only high-signal variations
 * - Maximum 4 variants total
 *
 * PRIORITY ORDER:
 * 1. Base
 * 2. Layout
 * 3. Alignment (single contextual change)
 * 4. CTA (downgrade only)
 */

export type HeroDecisions = {
  alignment: "left" | "center" | "right";
  layout: "text-only" | "split";
  density: "compact" | "comfortable";
  cta: "none" | "single" | "dual";
  background: "solid" | "transparent";
};

export type HeroVariation = {
  decisions: HeroDecisions;
  label: string;
  description: string;
};

export function deriveHeroVariations(base: HeroDecisions): HeroVariation[] {
  const variations: HeroVariation[] = [];

  /* ────────────────────────────────────────────────
     1. Base (always first)
  ──────────────────────────────────────────────── */

  variations.push({
    decisions: base,
    label: "Discovery Recommended",
    description: "AI-recommended hero configuration",
  });

  /* ────────────────────────────────────────────────
     2. Layout variation (highest value)
  ──────────────────────────────────────────────── */

  const alternateLayout = base.layout === "split" ? "text-only" : "split";

  variations.push({
    decisions: { ...base, layout: alternateLayout },
    label:
      alternateLayout === "text-only" ? "Text-Only Layout" : "Split Layout",
    description:
      alternateLayout === "text-only"
        ? "Minimal, typography-focused hero"
        : "Text and image presented side-by-side",
  });

  if (variations.length >= 4) return variations;

  /* ────────────────────────────────────────────────
     3. Alignment variation (contextual, single)
  ──────────────────────────────────────────────── */

  let derivedAlignment: HeroDecisions["alignment"] | null = null;

  if (base.alignment === "center") {
    derivedAlignment = "left";
  } else {
    derivedAlignment = "center";
  }

  variations.push({
    decisions: { ...base, alignment: derivedAlignment },
    label:
      derivedAlignment === "center"
        ? "Centered Content"
        : "Left-Aligned Content",
    description:
      derivedAlignment === "center"
        ? "Balanced, centered hero layout"
        : "Editorial, left-aligned presentation",
  });

  if (variations.length >= 4) return variations;

  /* ────────────────────────────────────────────────
     4. CTA variation (downgrade only)
  ──────────────────────────────────────────────── */

  let downgradedCTA: HeroDecisions["cta"] | null = null;

  if (base.cta === "dual") downgradedCTA = "single";
  else if (base.cta === "single") downgradedCTA = "none";

  if (downgradedCTA) {
    variations.push({
      decisions: { ...base, cta: downgradedCTA },
      label:
        downgradedCTA === "none"
          ? "No Call-to-Action"
          : "Single Call-to-Action",
      description:
        downgradedCTA === "none"
          ? "Purely informational hero"
          : "Focused hero with one primary action",
    });
  }

  return variations;
}
