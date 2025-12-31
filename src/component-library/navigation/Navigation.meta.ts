/**
 * Navigation Component Metadata
 * ⚠️ SOURCE OF TRUTH
 *
 * - Edit this file only
 * - Navigation.catalog.json is auto-generated
 * - Do NOT put runtime logic here
 */

export const NavigationMeta = {
  /**
   * Component-level metadata
   */
  component: {
    /** Stable unique ID (used in DB & matching) */
    id: "navigation",

    /** Human readable name */
    name: "Navigation",

    /** High-level category */
    category: "navigation" as const,

    /** Short description */
    description:
      "Primary site navigation with responsive layout and optional CTA",

    /** Search & classification tags */
    tags: [
      "navigation",
      "navbar",
      "header",
      "menu",
      "responsive",
      "mobile",
      "shadcn",
    ],

    /** Primary intents this component serves */
    intents: ["marketing", "portfolio", "product", "dashboard"] as const,

    /** Common use cases */
    useCases: [
      "Main site navigation",
      "Landing page header",
      "Product or dashboard header",
    ],

    /**
     * Base capabilities (guaranteed)
     */
    baseCapabilities: {
      responsive: true,
      accessible: true,
      supportsMobileMenu: true,
    },

    /** External deps required for rendering */
    dependencies: ["lucide-react", "shadcn/ui", "tailwindcss"],

    /**
     * CONTENT CONTRACT
     * ❌ NOT runtime validation
     * ✅ Used for matching, previews & UI hints
     */
    contentSchema: {
      primaryLinks: {
        type: "array",
        required: true,
        description: "Primary navigation links",
        constraints: {
          minItems: 1,
          maxItems: 8,
        },
        itemShape: {
          label: "string",
          href: "string",
          icon: "string?",
        },
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
        default: "left",
        ui: {
          control: "segmented",
          label: "Alignment",
          descriptions: {
            left: "Navigation items aligned to the left",
            center: "Navigation items centered",
            right: "Navigation items aligned to the right",
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
            compact: "Compact height and spacing",
            comfortable: "Comfortable spacing",
          },
        },
      },

      background: {
        type: "enum",
        options: ["solid", "transparent", "blur"],
        default: "solid",
        ui: {
          control: "radio",
          label: "Background",
          descriptions: {
            solid: "Solid background with border/shadow",
            transparent: "Transparent background",
            blur: "Glass / backdrop blur",
          },
        },
      },
    },
  },

  /**
   * Variants (DEPRECATED)
   * Navigation is fully decision-driven
   */
  variants: {} as const,

  /**
   * Meta information (non-functional)
   */
  metadata: {
    version: "2.0.0",
    author: "Sibtain",
    system: "decision-driven",
  },
} as const;
