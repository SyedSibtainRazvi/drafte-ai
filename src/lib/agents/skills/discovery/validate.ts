import type { DiscoveryOutput } from "./schema";
import {
  DiscoveryOutputSchema,
  FooterProposalSchema,
  HeroProposalSchema,
  NavigationProposalSchema,
} from "./schema";

/**
 * Validate discovery output
 * Matches backend validation pattern
 */
function validateDiscovery(discovery: DiscoveryOutput) {
  if (discovery.version !== "discovery_v2") {
    throw new Error("Invalid version - only discovery_v2 is supported");
  }

  if (discovery.components.length !== 3) {
    throw new Error(
      `Exactly 3 components required (navigation, hero, footer). Found: ${discovery.components.length}`,
    );
  }

  // Validate each component's proposal
  for (const comp of discovery.components) {
    if (comp.type === "navigation") {
      if (comp.proposal === null || comp.proposal === undefined) {
        throw new Error(
          `Navigation component "${comp.name}" must include a proposal (cannot be null)`,
        );
      }
      const result = NavigationProposalSchema.safeParse(comp.proposal);
      if (!result.success) {
        throw new Error(
          `Invalid navigation proposal for "${comp.name}": ${result.error.message}`,
        );
      }
    } else if (comp.type === "hero") {
      if (comp.proposal === null || comp.proposal === undefined) {
        throw new Error(
          `Hero component "${comp.name}" must include a proposal (cannot be null)`,
        );
      }
      const result = HeroProposalSchema.safeParse(comp.proposal);
      if (!result.success) {
        throw new Error(
          `Invalid hero proposal for "${comp.name}": ${result.error.message}`,
        );
      }
    } else if (comp.type === "footer") {
      if (comp.proposal === null || comp.proposal === undefined) {
        throw new Error(
          `Footer component "${comp.name}" must include a proposal (cannot be null)`,
        );
      }
      const result = FooterProposalSchema.safeParse(comp.proposal);
      if (!result.success) {
        throw new Error(
          `Invalid footer proposal for "${comp.name}": ${result.error.message}`,
        );
      }
    }
  }

  // Validate component counts
  const countByType = discovery.components.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if ((countByType.navigation ?? 0) !== 1) {
    throw new Error("Exactly one navigation component is required");
  }
  if ((countByType.footer ?? 0) !== 1) {
    throw new Error("Exactly one footer component is required");
  }
  if ((countByType.hero ?? 0) !== 1) {
    throw new Error("Exactly one hero component is required");
  }

  // Validate component types
  const validTypes = new Set(["navigation", "hero", "footer"]);
  const invalidTypes = discovery.components.filter(
    (c) => !validTypes.has(c.type),
  );
  if (invalidTypes.length > 0) {
    throw new Error(
      `Invalid component types found: ${invalidTypes.map((c) => c.type).join(", ")}. Only navigation, hero, and footer are allowed.`,
    );
  }

  // Validate layout
  if (discovery.layout.type !== "single-page") {
    throw new Error("Only single-page layouts are allowed");
  }

  // Validate layout flow references
  const componentNames = new Set(discovery.components.map((c) => c.name));
  for (const name of discovery.layout.flow) {
    if (!componentNames.has(name)) {
      const availableNames = Array.from(componentNames).join(", ");
      throw new Error(
        `Layout flow references missing component: "${name}". Available names: ${availableNames}`,
      );
    }
  }

  // Ensure all components are in flow
  for (const c of discovery.components) {
    if (!discovery.layout.flow.includes(c.name)) {
      throw new Error(`Component not present in layout flow: ${c.name}`);
    }
  }
}

/**
 * Normalize flow names (matches backend pattern)
 */
function normalizeFlowNames(discovery: DiscoveryOutput): DiscoveryOutput {
  const componentNames = new Set(discovery.components.map((c) => c.name));
  const typeToNameMap = new Map<string, string>();

  for (const comp of discovery.components) {
    const sameTypeCount = discovery.components.filter(
      (c) => c.type === comp.type,
    ).length;
    if (sameTypeCount === 1) {
      typeToNameMap.set(comp.type.toLowerCase(), comp.name);
      typeToNameMap.set(comp.type, comp.name);
    }
  }

  const normalizedFlowArray = discovery.layout.flow.map((flowItem) => {
    if (componentNames.has(flowItem)) {
      return flowItem;
    }
    const lowerFlowItem = flowItem.toLowerCase();
    const mappedName = typeToNameMap.get(lowerFlowItem);
    if (mappedName) {
      return mappedName;
    }
    return flowItem;
  });

  if (normalizedFlowArray.length === 0) {
    throw new Error("Layout flow cannot be empty");
  }

  return {
    ...discovery,
    layout: {
      ...discovery.layout,
      flow: normalizedFlowArray,
    },
  };
}

/**
 * Extract missing fields from Zod error for better error messages
 */
// biome-ignore lint/suspicious/noExplicitAny: <false positive>
function extractMissingFields(error: any): string {
  if (!error || !error.issues) {
    return "Unknown validation error";
  }

  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  for (const issue of error.issues) {
    if (issue.code === "invalid_type" && issue.received === "undefined") {
      missingFields.push(issue.path.join("."));
    } else if (
      issue.code === "invalid_union" &&
      issue.note === "No matching discriminator"
    ) {
      missingFields.push(`${issue.path.join(".")}.type`);
    } else if (issue.code === "invalid_value") {
      invalidFields.push(`${issue.path.join(".")} (received invalid value)`);
    } else {
      invalidFields.push(`${issue.path.join(".")}: ${issue.message}`);
    }
  }

  const messages: string[] = [];
  if (missingFields.length > 0) {
    messages.push(`Missing fields: ${missingFields.join(", ")}`);
  }
  if (invalidFields.length > 0) {
    messages.push(`Invalid fields: ${invalidFields.join(", ")}`);
  }

  return messages.join(". ") || error.message || "Validation failed";
}

/**
 * Validate and normalize discovery output
 * Now that we use JSON mode, we can directly validate against the strict schema
 */
export function validateAndNormalizeDiscovery(
  rawDiscovery: unknown,
): DiscoveryOutput {
  try {
    // Parse and validate using strict schema (with discriminated unions)
    const parsed = DiscoveryOutputSchema.parse(rawDiscovery);

    // Run custom validation
    validateDiscovery(parsed);

    // Normalize flow names
    const normalized = normalizeFlowNames(parsed);

    return normalized;
  } catch (error) {
    // Extract specific missing fields for better error messages
    const errorMessage = extractMissingFields(error);
    const enhancedError = new Error(errorMessage);
    if (error instanceof Error) {
      enhancedError.stack = error.stack;
    }
    throw enhancedError;
  }
}
