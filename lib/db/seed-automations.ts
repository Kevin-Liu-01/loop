/**
 * Apply sources and automation config to all seeded skills.
 * Also changes origin to "user" so the refresh pipeline can track them.
 *
 * Safe to re-run – updates are idempotent.
 *
 * Usage: npx tsx lib/db/seed-automations.ts
 */

import { getSkillBySlug, updateSkill } from "@/lib/db/skills";
import { SKILL_SOURCE_CONFIGS } from "@/lib/db/seed-data/skill-sources";

async function applySourcesAndAutomation(): Promise<{
  updated: number;
  skipped: number;
  errors: number;
}> {
  console.log(`\n[1/2] Applying sources and automation to ${SKILL_SOURCE_CONFIGS.length} skills...`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const cfg of SKILL_SOURCE_CONFIGS) {
    try {
      const existing = await getSkillBySlug(cfg.slug);
      if (!existing) {
        console.log(`  [skip] ${cfg.slug} – not found in DB`);
        skipped++;
        continue;
      }

      await updateSkill(cfg.slug, {
        origin: "user",
        sources: cfg.sources,
        automation: cfg.automation
      });

      const sourceCount = cfg.sources.length;
      const cadence = cfg.automation.cadence;
      console.log(`  [ok]   ${cfg.slug} – ${sourceCount} sources, ${cadence} cadence`);
      updated++;
    } catch (error) {
      console.error(`  [err]  ${cfg.slug}: ${(error as Error).message}`);
      errors++;
    }
  }

  return { updated, skipped, errors };
}

function printSummary(result: { updated: number; skipped: number; errors: number }): void {
  console.log("\n[2/2] Summary");
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Skipped: ${result.skipped}`);
  console.log(`  Errors:  ${result.errors}`);
  console.log(`  Total:   ${SKILL_SOURCE_CONFIGS.length}`);
}

async function main(): Promise<void> {
  console.log("=== Automation Seeder ===");

  const result = await applySourcesAndAutomation();
  printSummary(result);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
