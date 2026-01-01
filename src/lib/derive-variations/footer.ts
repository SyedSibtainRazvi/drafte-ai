/**
 * Footer Variation Engine (v1)
 *
 * Rules:
 * - Footer is mostly deterministic
 * - Only ONE alternative is derived
 * - Maximum 2 variants total
 *
 * PRIORITY:
 * 1. Base (Discovery Recommended)
 * 2. Alignment variation
 */

export type FooterDecisions = {
  alignment: "left" | "center" | "right";
  layout: "text" | "links";
  density: "compact" | "comfortable";
  showCopyright: boolean;
};

export type FooterVariation = {
  decisions: FooterDecisions;
  label: string;
  description: string;
};

export function deriveFooterVariations(
  base: FooterDecisions,
): FooterVariation[] {
  const variations: FooterVariation[] = [];

  /* ────────────────────────────────────────────────
     1. Base
  ──────────────────────────────────────────────── */

  variations.push({
    decisions: base,
    label: "Discovery Recommended",
    description: "",
  });

  /* ────────────────────────────────────────────────
     2. Alignment variation (single)
  ──────────────────────────────────────────────── */

  let derivedAlignment: FooterDecisions["alignment"] | null = null;

  if (base.alignment === "center") {
    derivedAlignment = "left";
  } else {
    derivedAlignment = "center";
  }

  variations.push({
    decisions: { ...base, alignment: derivedAlignment },
    label:
      derivedAlignment === "center" ? "Centered Footer" : "Left-Aligned Footer",
    description:
      derivedAlignment === "center"
        ? "Centered footer content"
        : "Left-aligned footer content",
  });

  return variations;
}
