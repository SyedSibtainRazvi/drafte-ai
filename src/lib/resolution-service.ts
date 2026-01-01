import type { DiscoveryOutput } from "@/lib/agents/skills/discovery/schema";
import { decisionValidator } from "@/lib/decision-validator";
import type { DiscoveryComponent } from "@/lib/discovery-types";
import { prisma } from "@/lib/prisma";

export interface ResolutionResult {
  success: boolean;
  message: string;
  componentCount?: number;
}

/**
 * Service for creating and managing resolution specs from discovery output
 */
export class ResolutionService {
  /**
   * Creates a resolution spec from discovery output if it doesn't already exist
   */
  async createResolutionSpec(
    runId: string,
    discovery: DiscoveryOutput,
  ): Promise<ResolutionResult> {
    try {
      // Check if resolution spec already exists to avoid re-processing
      const existingProject = await prisma.project.findUnique({
        where: { id: runId },
        select: { resolutionSpec: true },
      });

      if (existingProject?.resolutionSpec) {
        return {
          success: true,
          message: `Resolution spec already exists for project ${runId}, skipping creation`,
        };
      }

      console.log(
        `[ResolutionService] Creating resolution spec for project ${runId}`,
      );

      // Reset validator for this project
      decisionValidator.reset();

      const validatedComponents: Array<{
        componentKey: string;
        decisions: Record<string, unknown> | null;
        position: number;
        contentSignals?: Record<string, unknown>;
      }> = [];

      for (let i = 0; i < discovery.components.length; i++) {
        const planned = discovery.components[i] as DiscoveryComponent;
        const validation = decisionValidator.validateDecisions({
          name: planned.name,
          type: planned.type,
          proposal: planned.proposal,
          intentHint: planned.intentHint || undefined,
          reasoning: planned.reasoning || undefined,
          contentGoal: planned.contentGoal || undefined,
          ctaIntent: planned.ctaIntent || undefined,
        });

        if (!validation.valid) {
          throw new Error(
            `Invalid decisions for ${planned.name} (${planned.type}): ${validation.errors?.join(", ")}`,
          );
        }

        // Extract content generation signals
        const contentSignals: Record<string, unknown> = {};
        if (planned.contentGoal) {
          contentSignals.contentGoal = planned.contentGoal;
        }
        if (planned.ctaIntent) {
          contentSignals.ctaIntent = planned.ctaIntent;
        }

        // Store in ProjectComponent
        if (validation.componentKey) {
          await prisma.projectComponent.create({
            data: {
              id: crypto.randomUUID(),
              projectId: runId,
              componentKey: validation.componentKey,
              decisions: validation.decisions
                ? (validation.decisions as any)
                : undefined,
              position: i,
              selected: true,
              meta:
                Object.keys(contentSignals).length > 0
                  ? (contentSignals as any)
                  : undefined,
              updatedAt: new Date(),
            },
          });

          validatedComponents.push({
            componentKey: validation.componentKey,
            decisions: validation.decisions || null,
            position: i,
            ...(Object.keys(contentSignals).length > 0 && {
              contentSignals,
            }),
          });

          console.log(
            `   ✅ ${planned.name} (${planned.type}) → decisions validated and stored`,
          );
        }
      }

      // Store resolution spec for backward compatibility
      const resolutionSpec = {
        version: "v2",
        resolvedAt: new Date().toISOString(),
        // Project-level content signals
        ...(discovery.voice && {
          voice: discovery.voice,
        }),
        ...(discovery.persona && {
          persona: discovery.persona,
        }),
        components: validatedComponents.map((v) => ({
          componentKey: v.componentKey,
          decisions: v.decisions,
          ...(v.contentSignals && { contentSignals: v.contentSignals }),
        })),
      };

      await prisma.project.update({
        where: { id: runId },
        data: {
          resolutionSpec: resolutionSpec as any,
          resolutionSpecVersion: "v2",
          status: "CONTENT_GENERATING",
          updatedAt: new Date(),
        },
      });

      console.log(
        `[ResolutionService] Resolution spec created and stored for project ${runId}`,
      );

      return {
        success: true,
        message: `Resolution spec created successfully for project ${runId}`,
        componentCount: validatedComponents.length,
      };
    } catch (error) {
      console.error(
        "[ResolutionService] Error creating resolution spec:",
        error,
      );
      return {
        success: false,
        message: `Failed to create resolution spec: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

// Export singleton instance
export const resolutionService = new ResolutionService();
