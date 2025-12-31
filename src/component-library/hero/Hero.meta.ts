/**
 * Hero Component Metadata
 * ⚠️ SOURCE OF TRUTH
 *
 * - Edit this file only
 * - Hero.catalog.json is auto-generated
 * - Do NOT put runtime logic here
 */

export const HeroMeta = {
  /**
   * Component-level metadata
   */
  component: {
    /** Stable unique ID (used in DB & matching) */
    id: "hero",

    /** Human readable name */
    name: "Hero",

    /** High-level category */
    category: "hero" as const,

    /** Short description */
    description:
      "Primary hero section for landing pages, portfolios, and product pages",

    /** Search & classification tags */
    tags: [
      "hero",
      "landing",
      "portfolio",
      "marketing",
      "header",
      "introduction",
      "responsive",
      "shadcn",
      "interactive",
    ],

    /** Primary intents this component serves */
    intents: ["portfolio", "marketing", "product"] as const,

    /** Common use cases */
    useCases: [
      "Portfolio introduction",
      "Landing page hero",
      "Product overview section",
      "Personal brand showcase",
    ],

    /**
     * Base capabilities (guaranteed)
     */
    baseCapabilities: {
      responsive: true,
      accessible: true,
      supportsCTA: true,
      supportsVisuals: true,
      supportsHoverEffects: true,
    },

    /** External deps required for rendering */
    dependencies: ["shadcn/ui", "tailwindcss", "lucide-react"],

    /**
     * CONTENT CONTRACT
     * ❌ NOT runtime validation
     * ✅ Used for discovery, previews & UI hints
     */
    contentSchema: {
      title: {
        type: "string",
        required: true,
        description: "Primary hero headline",
      },

      subtitle: {
        type: "string",
        required: false,
        description: "Supporting description text",
      },

      image: {
        type: "string",
        required: false,
        description:
          "Hero image (used in split layout with left/right alignment)",
      },

      ctaPrimary: {
        type: "string",
        required: false,
        description: "Primary call-to-action label",
      },

      ctaSecondary: {
        type: "string",
        required: false,
        description: "Secondary call-to-action label (used when CTA is dual)",
      },
    },

    /**
     * DECISION SCHEMA
     * Defines the design space for this component
     */
    decisionSchema: {
      alignment: {
        type: "enum",
        options: ["left", "center", "right"],
        default: "center",
        ui: {
          control: "segmented",
          label: "Alignment",
          descriptions: {
            left: "Text on left, image on right (split layout only)",
            center: "Centered content (text-only, no image)",
            right: "Text on right, image on left (split layout only)",
          },
        },
      },

      layout: {
        type: "enum",
        options: ["text-only", "split"],
        default: "text-only",
        ui: {
          control: "radio",
          label: "Layout",
          descriptions: {
            "text-only": "Text-focused hero without visuals",
            split: "Text with image beside it (left/right alignment only)",
          },
        },
      },

      density: {
        type: "enum",
        options: ["compact", "comfortable"],
        default: "comfortable",
        ui: {
          control: "toggle",
          label: "Density",
          descriptions: {
            compact: "Tighter vertical spacing",
            comfortable: "More breathing room",
          },
        },
      },

      cta: {
        type: "enum",
        options: ["none", "single", "dual"],
        default: "single",
        ui: {
          control: "radio",
          label: "Call To Action",
          descriptions: {
            none: "No call-to-action",
            single: "Single primary CTA",
            dual: "Primary and secondary CTAs",
          },
        },
      },

      background: {
        type: "enum",
        options: ["solid", "transparent"],
        default: "solid",
        ui: {
          control: "radio",
          label: "Background",
          descriptions: {
            solid: "Solid background",
            transparent: "Transparent background",
          },
        },
      },
    },
  },

  /**
   * Variants (DEPRECATED)
   * Hero is fully decision-driven
   */
  variants: {} as const,

  /**
   * Meta information (non-functional)
   */
  metadata: {
    version: "2.1.0",
    author: "Sibtain",
    system: "decision-driven",
    lastUpdated: "2025-01-25",
  },
} as const;
