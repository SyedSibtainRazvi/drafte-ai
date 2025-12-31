/// <reference types="node" />
import "dotenv/config";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";

/**
 * DATABASE SEED SCRIPT
 * --------------------
 * This script crawls the component library, reads *.catalog.json files,
 * and synchronizes them with the database.
 */

/**
 * Determine the component library path based on where the script is executed.
 */
function getComponentLibraryPath(): string {
  const rootPath = join(process.cwd(), "src/component-library");
  const upPath = join(process.cwd(), "..", "src", "component-library");

  if (existsSync(rootPath)) return rootPath;
  if (existsSync(upPath)) return upPath;

  throw new Error(
    `Component library not found. Checked:\n  - ${rootPath}\n  - ${upPath}`,
  );
}

const COMPONENT_LIBRARY_PATH = getComponentLibraryPath();

type Catalog = {
  component: {
    id: string;
    name: string;
    category?: string;
    description?: string;
    tags?: string[];
    intents?: string[];
    useCases?: string[];
    baseCapabilities?: Record<string, unknown>;
    contentSchema?: unknown;
    dependencies?: string[];
    decisionSchema?: unknown;
  };
  variants: Array<{
    variantKey: string;
    name: string;
    description?: string;
    styleTags?: string[];
    codeRef: string;
    previewProps?: unknown;
    dependencies?: string[];
    isDefault?: boolean;
    order?: number;
    intents?: string[];
    capabilities?: Record<string, unknown>;
    file?: string;
  }>;
  metadata?: {
    version?: string;
    author?: string;
    system?: string;
    lastUpdated?: string;
    generatedAt?: string;
  };
};

/**
 * Recursively find *.catalog.json files
 */
async function findCatalogs(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await findCatalogs(fullPath)));
      }

      if (entry.isFile() && entry.name.endsWith(".catalog.json")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to read directory ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return files;
}

/**
 * Validate catalog structure
 */
function validateCatalog(
  catalog: unknown,
  filePath: string,
): catalog is Catalog {
  if (typeof catalog !== "object" || catalog === null) {
    throw new Error(`Invalid catalog: not an object (${filePath})`);
  }

  const cat = catalog as Record<string, unknown>;

  if (!cat.component || typeof cat.component !== "object") {
    throw new Error(`Invalid catalog: missing component (${filePath})`);
  }

  const component = cat.component as Record<string, unknown>;

  if (typeof component.id !== "string" || !component.id) {
    throw new Error(`Invalid catalog: component.id is required (${filePath})`);
  }

  if (typeof component.name !== "string" || !component.name) {
    throw new Error(
      `Invalid catalog: component.name is required (${filePath})`,
    );
  }

  return true;
}

async function seed() {
  console.log("🌱 Seeding component registry...\n");
  console.log(`📂 Searching in: ${COMPONENT_LIBRARY_PATH}\n`);

  const catalogFiles = await findCatalogs(COMPONENT_LIBRARY_PATH);

  if (catalogFiles.length === 0) {
    console.error(`❌ No catalog files found in ${COMPONENT_LIBRARY_PATH}`);
    process.exit(1);
  }

  console.log(`Found ${catalogFiles.length} catalog file(s)\n`);

  const processedComponents = new Set<string>();
  let successCount = 0;
  let errorCount = 0;

  for (const [index, filePath] of catalogFiles.entries()) {
    try {
      const raw = await readFile(filePath, "utf-8");
      let catalog: Catalog;

      try {
        catalog = JSON.parse(raw) as Catalog;
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }

      validateCatalog(catalog, filePath);

      const { component, metadata } = catalog;

      console.log(
        `[${index + 1}/${catalogFiles.length}] Processing: ${component.name}`,
      );

      await prisma.$transaction(async (tx) => {
        await tx.component.upsert({
          where: { componentKey: component.id },
          update: {
            name: component.name,
            category: component.category ?? null,
            description: component.description ?? null,
            tags: component.tags ?? [],
            propsSchema: component.contentSchema
              ? (component.contentSchema as any)
              : undefined,
            decisionSchema: component.decisionSchema
              ? (component.decisionSchema as any)
              : undefined,
            version: metadata?.version ?? "1.0",
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            id: crypto.randomUUID(),
            componentKey: component.id,
            name: component.name,
            category: component.category ?? null,
            description: component.description ?? null,
            tags: component.tags ?? [],
            propsSchema: component.contentSchema
              ? (component.contentSchema as any)
              : undefined,
            decisionSchema: component.decisionSchema
              ? (component.decisionSchema as any)
              : undefined,
            version: metadata?.version ?? "1.0",
            isActive: true,
            updatedAt: new Date(),
          },
        });
      });

      processedComponents.add(component.id);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error processing ${filePath}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(`\n✅ Seeding complete:`);
  console.log(`   ✓ Successfully processed: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ✗ Errors: ${errorCount}`);
  }
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
