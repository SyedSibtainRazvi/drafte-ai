/**
 * Navigation Variation Engine (v1)
 *
 * Rules:
 * - Base variant is always first (Discovery Recommended)
 * - Change only ONE decision per variant
 * - Derive only high-signal variations
 * - Maximum 3 variants total
 *
 * PRIORITY ORDER:
 * 1. Base
 * 2. Alignment (single contextual change)
 * 3. Background (single contextual change)
 */

export type NavigationDecisions = {
  alignment: "left" | "center" | "right";
  density: "compact" | "comfortable";
  background: "solid" | "transparent" | "blur";
};

export type NavigationVariation = {
  decisions: NavigationDecisions;
  label: string;
  description: string;
};

export function deriveNavigationVariations(
  base: NavigationDecisions,
): NavigationVariation[] {
  const variations: NavigationVariation[] = [];

  /* ────────────────────────────────────────────────
     1. Base (always first)
  ──────────────────────────────────────────────── */

  variations.push({
    decisions: base,
    label: "Discovery Recommended",
    description: "",
  });

  /* ────────────────────────────────────────────────
     2. Alignment variation (single, contextual)
  ──────────────────────────────────────────────── */

  let derivedAlignment: NavigationDecisions["alignment"] | null = null;

  if (base.alignment === "center") {
    derivedAlignment = "left";
  } else {
    derivedAlignment = "center";
  }

  variations.push({
    decisions: { ...base, alignment: derivedAlignment },
    label:
      derivedAlignment === "center"
        ? "Centered Navigation"
        : "Left-Aligned Navigation",
    description:
      derivedAlignment === "center"
        ? "Balanced, centered navigation layout"
        : "Traditional, left-aligned navigation",
  });

  if (variations.length >= 3) return variations;

  /* ────────────────────────────────────────────────
     3. Background variation (single, contextual)
  ──────────────────────────────────────────────── */

  let derivedBackground: NavigationDecisions["background"] | null = null;

  if (base.background === "solid") {
    derivedBackground = "transparent";
  } else {
    derivedBackground = "solid";
  }

  variations.push({
    decisions: { ...base, background: derivedBackground },
    label:
      derivedBackground === "transparent"
        ? "Transparent Background"
        : "Solid Background",
    description:
      derivedBackground === "transparent"
        ? "Modern, transparent navigation"
        : "Clear navigation with solid background",
  });

  return variations;
}
