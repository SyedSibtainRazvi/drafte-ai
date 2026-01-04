import { FooterMeta } from "@/component-library/footer/Footer.meta";
import { HeroMeta } from "@/component-library/hero/Hero.meta";
import { NavigationMeta } from "@/component-library/navigation/Navigation.meta";

type ComponentMeta = {
  component: {
    contentSchema: Record<string, unknown>;
  };
};

export const COMPONENT_METADATA: Record<string, ComponentMeta> = {
  hero: HeroMeta,
  footer: FooterMeta,
  navigation: NavigationMeta,
};

/**
 * Returns the active content fields for a component
 * based on its validated design decisions.
 */
export function getActiveContentFields(
  componentKey: string,
  decisions: Record<string, any>,
): string[] {
  const meta = COMPONENT_METADATA[componentKey];

  if (!meta) {
    console.warn(`[Content] No metadata found for component: ${componentKey}`);
    return [];
  }

  const allFields = Object.keys(meta.component.contentSchema);
  const activeFields: string[] = [];

  for (const field of allFields) {
    let isActive = true;

    // Hero-specific rules
    if (componentKey === "hero") {
      if (
        field === "image" &&
        (decisions.layout !== "split" || decisions.alignment === "center")
      ) {
        isActive = false;
      }

      if (field === "ctaPrimary" && decisions.cta === "none") {
        isActive = false;
      }

      if (field === "ctaSecondary" && decisions.cta !== "dual") {
        isActive = false;
      }
    }

    // Footer-specific rules
    if (componentKey === "footer") {
      if (field === "links" && decisions.layout === "text") {
        isActive = false;
      }

      if (field === "copyright" && decisions.showCopyright === false) {
        isActive = false;
      }
    }

    // Navigation: mostly static for now

    if (isActive) activeFields.push(field);
  }

  return activeFields;
}
