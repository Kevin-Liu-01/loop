/**
 * Apply logoUrl to all skill sources stored in Supabase and
 * re-seed categories with logos on their sources.
 *
 * Usage: npx tsx lib/db/seed-logos.ts
 */

import { seedCategories } from "@/lib/db/categories";
import { updateSkill } from "@/lib/db/skills";
import { computeSourceLogoUrl } from "@/lib/skill-icons";
import { SKILL_SOURCE_CONFIGS } from "@/lib/db/seed-data/skill-sources";
import { CATEGORY_REGISTRY } from "@/lib/registry";

async function applySourceLogos(): Promise<{ updated: number; errors: number }> {
  console.log(`\n[1/2] Applying source logos to ${SKILL_SOURCE_CONFIGS.length} skills...`);

  let updated = 0;
  let errors = 0;

  for (const cfg of SKILL_SOURCE_CONFIGS) {
    try {
      const sourcesWithLogos = cfg.sources.map((source) => ({
        ...source,
        logoUrl: source.logoUrl || computeSourceLogoUrl(source.url)
      }));

      await updateSkill(cfg.slug, { sources: sourcesWithLogos });
      console.log(`  [ok]   ${cfg.slug} – ${sourcesWithLogos.length} sources with logos`);
      updated++;
    } catch (error) {
      console.error(`  [err]  ${cfg.slug}: ${(error as Error).message}`);
      errors++;
    }
  }

  return { updated, errors };
}

async function applyCategoryLogos(): Promise<void> {
  console.log(`\n[2/2] Re-seeding ${CATEGORY_REGISTRY.length} categories with source logos + icons...`);
  await seedCategories(CATEGORY_REGISTRY);
  console.log(`  ${CATEGORY_REGISTRY.length} categories updated`);
}

async function main(): Promise<void> {
  console.log("=== Logo Seeder ===");

  const result = await applySourceLogos();
  await applyCategoryLogos();

  console.log("\nSummary");
  console.log(`  Skills updated: ${result.updated}`);
  console.log(`  Errors: ${result.errors}`);
  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Logo seed failed:", error);
    process.exit(1);
  });
