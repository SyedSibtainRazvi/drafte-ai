import type { FooterDecisions } from "@/component-library/footer/footer.types";
import type { HeroDecisions } from "@/component-library/hero/hero.types";
import type { NavigationDecisions } from "@/component-library/navigation/navigation.types";

// Proposal types from discovery schema
export type NavigationProposal = {
  alignment: "left" | "center" | "right";
  density: "compact" | "comfortable";
  background: "solid" | "transparent" | "blur";
};

export type HeroProposal = {
  alignment: "left" | "center" | "right";
  layout: "text-only" | "split";
  density: "compact" | "comfortable";
  cta: "none" | "single" | "dual";
  background: "solid" | "transparent";
};

export type FooterProposal = {
  alignment: "left" | "center" | "right";
  layout: "text" | "links";
  density: "compact" | "comfortable";
  showCopyright: boolean;
};

export type ComponentProposal =
  | NavigationProposal
  | HeroProposal
  | FooterProposal;
type ComponentDecisions = NavigationDecisions | HeroDecisions | FooterDecisions;

export interface ComponentWithDecisions {
  name: string;
  type: "navigation" | "hero" | "footer";
  proposal?: ComponentProposal;
  intentHint?: string;
  reasoning?: string;
  contentGoal?: string;
  ctaIntent?: string;
}

export interface ValidationResult {
  valid: boolean;
  componentKey?: string;
  decisions?: ComponentDecisions | null;
  errors?: string[];
}

export class DecisionValidator {
  private componentCounter = new Map<string, number>();

  validateDecisions(component: ComponentWithDecisions): ValidationResult {
    const { name, type, proposal } = component;

    // Generate component key
    const count = this.componentCounter.get(type) || 0;
    this.componentCounter.set(type, count + 1);
    const componentKey = count === 0 ? type : `${type}_${count}`;

    // Basic validation - ensure proposal exists
    if (!proposal) {
      return {
        valid: false,
        errors: [`No proposal provided for ${name} (${type})`],
      };
    }

    try {
      // Type-specific validation using proposal as decisions
      switch (type) {
        case "navigation":
          this.validateNavigationDecisions(proposal);
          break;
        case "hero":
          this.validateHeroDecisions(proposal);
          break;
        case "footer":
          this.validateFooterDecisions(proposal);
          break;
        default:
          return {
            valid: false,
            errors: [`Unknown component type: ${type}`],
          };
      }

      return {
        valid: true,
        componentKey,
        decisions: proposal,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : "Validation failed"],
      };
    }
  }

  private validateNavigationDecisions(proposal: ComponentProposal): void {
    const navProposal = proposal as NavigationProposal;
    if (!["left", "center", "right"].includes(navProposal.alignment)) {
      throw new Error(`Invalid navigation alignment: ${navProposal.alignment}`);
    }
    if (!["compact", "comfortable"].includes(navProposal.density)) {
      throw new Error(`Invalid navigation density: ${navProposal.density}`);
    }
    if (!["solid", "transparent", "blur"].includes(navProposal.background)) {
      throw new Error(
        `Invalid navigation background: ${navProposal.background}`,
      );
    }
  }

  private validateHeroDecisions(proposal: ComponentProposal): void {
    const heroProposal = proposal as HeroProposal;
    if (!["left", "center", "right"].includes(heroProposal.alignment)) {
      throw new Error(`Invalid hero alignment: ${heroProposal.alignment}`);
    }
    if (!["text-only", "split"].includes(heroProposal.layout)) {
      throw new Error(`Invalid hero layout: ${heroProposal.layout}`);
    }
    if (!["compact", "comfortable"].includes(heroProposal.density)) {
      throw new Error(`Invalid hero density: ${heroProposal.density}`);
    }
    if (!["none", "single", "dual"].includes(heroProposal.cta)) {
      throw new Error(`Invalid hero cta: ${heroProposal.cta}`);
    }
    if (!["solid", "transparent"].includes(heroProposal.background)) {
      throw new Error(`Invalid hero background: ${heroProposal.background}`);
    }
  }

  private validateFooterDecisions(proposal: ComponentProposal): void {
    const footerProposal = proposal as FooterProposal;
    if (!["left", "center", "right"].includes(footerProposal.alignment)) {
      throw new Error(`Invalid footer alignment: ${footerProposal.alignment}`);
    }
    if (!["text", "links"].includes(footerProposal.layout)) {
      throw new Error(`Invalid footer layout: ${footerProposal.layout}`);
    }
    if (!["compact", "comfortable"].includes(footerProposal.density)) {
      throw new Error(`Invalid footer density: ${footerProposal.density}`);
    }
    if (typeof footerProposal.showCopyright !== "boolean") {
      throw new Error(
        `Invalid footer showCopyright: ${footerProposal.showCopyright}`,
      );
    }
  }

  reset(): void {
    this.componentCounter.clear();
  }
}

// Export singleton instance
export const decisionValidator = new DecisionValidator();
