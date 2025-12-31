/**
 * Generate Component Catalogs from .meta.ts files
 *
 * This script:
 * 1. Finds all *.meta.ts files in component-library
 * 2. Imports and validates them
 * 3. Generates corresponding .catalog.json files
 *
 * Run: npm run generate:catalogs
 */

import { readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Resolve component library root
const currentDir = dirname(new URL(import.meta.url).pathname);
const COMPONENT_LIBRARY_PATH = resolve(currentDir, "../src/component-library");

/**
 * Convert variants object → ordered array
 */
// biome-ignore lint/suspicious/noExplicitAny: Build script needs to handle dynamic meta files
function transformVariants(variants: Record<string, any>): any[] {
  return Object.values(variants).sort((a, b) => a.order - b.order);
}

/**
 * Generate catalog JSON from a single .meta.ts file
 */
async function generateCatalogFromMeta(metaPath: string): Promise<void> {
  try {
    const metaUrl = pathToFileURL(metaPath).href;
    const metaModule = await import(metaUrl);
    // Support any meta export: NavigationMeta, FooterMeta, HeroMeta, etc.
    const meta =
      metaModule.HeroMeta ||
      metaModule.NavigationMeta ||
      metaModule.FooterMeta ||
      metaModule.Meta ||
      metaModule.default ||
      Object.values(metaModule).find((exp: unknown) => {
        if (typeof exp === "object" && exp !== null && "component" in exp) {
          const meta = exp as { component?: { id?: unknown } };
          return typeof meta.component?.id === "string";
        }
        return false;
      });

    if (!meta?.component?.id) {
      throw new Error(`Invalid meta file (missing component.id): ${metaPath}`);
    }

    // Variants are optional (deprecated, kept for backward compatibility)
    const variantsArray =
      meta.variants &&
      typeof meta.variants === "object" &&
      Object.keys(meta.variants).length > 0
        ? transformVariants(meta.variants)
        : [];

    /**
     * Invariant checks (only if variants exist)
     */
    if (variantsArray.length > 0) {
      // 1. Exactly one default variant
      const defaultVariants = variantsArray.filter((v) => v.isDefault === true);
      if (defaultVariants.length !== 1) {
        throw new Error(
          `Component "${meta.component.id}" must have exactly ONE default variant (found ${defaultVariants.length})`,
        );
      }

      // 2. Each variant must have variantKey
      for (const variant of variantsArray) {
        if (!variant.variantKey) {
          throw new Error(`Variant missing variantKey in ${metaPath}`);
        }

        // 3. Warn if variantKey doesn't match file name
        if (
          typeof variant.file === "string" &&
          !variant.file.startsWith(variant.variantKey)
        ) {
          console.warn(
            `⚠️  Variant key "${variant.variantKey}" does not match file "${variant.file}" (${meta.component.id})`,
          );
        }
      }
    }

    /**
     * Build catalog JSON
     */
    const catalog = {
      component: {
        ...meta.component,
        intents: [...(meta.component.intents || [])],
        tags: [...(meta.component.tags || [])],
        useCases: [...(meta.component.useCases || [])],
        dependencies: [...(meta.component.dependencies || [])],
        // Include decisionSchema if present
        ...(meta.component.decisionSchema && {
          decisionSchema: meta.component.decisionSchema,
        }),
      },

      variants: variantsArray.map((variant) => ({
        ...variant,
        intents: [...(variant.intents || [])],
        styleTags: [...(variant.styleTags || [])],
      })),

      metadata: {
        ...(meta.metadata || {}),
        generatedAt: new Date().toISOString(),
        _note: `⚠️ AUTO-GENERATED. DO NOT EDIT. This file is generated from ${basename(metaPath)}.`,
      },
    };

    // Write catalog file
    const jsonPath = metaPath.replace(".meta.ts", ".catalog.json");
    await writeFile(jsonPath, JSON.stringify(catalog, null, 2), "utf-8");

    console.log(`✅ Generated: ${jsonPath}`);
  } catch (error) {
    console.error(`❌ Error processing ${metaPath}`);
    throw error;
  }
}

/**
 * Recursively find all .meta.ts files
 */
async function findMetaFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await findMetaFiles(fullPath)));
      }

      if (entry.isFile() && entry.name.endsWith(".meta.ts")) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist — ignore
  }

  return files;
}

/**
 * Main entry
 */
async function main() {
  console.log("🔄 Generating component catalogs...");
  console.log(`📁 Scanning: ${COMPONENT_LIBRARY_PATH}\n`);

  try {
    const metaFiles = await findMetaFiles(COMPONENT_LIBRARY_PATH);

    if (metaFiles.length === 0) {
      console.log("⚠️  No .meta.ts files found");
      return;
    }

    console.log(`Found ${metaFiles.length} meta file(s):\n`);

    for (const metaFile of metaFiles) {
      await generateCatalogFromMeta(metaFile);
    }

    console.log(`\n✅ Generated ${metaFiles.length} catalog file(s)`);
  } catch (_error) {
    console.error("❌ Catalog generation failed");
    process.exit(1);
  }
}

main();
