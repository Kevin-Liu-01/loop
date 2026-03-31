/**
 * Sync expanded skill bodies and agent docs to Supabase.
 *
 * Updates body, agent_docs, description, and tags for all 40 seed skills
 * without overwriting user-customized fields (automation, sources, etc).
 *
 * Usage: pnpm seed:sync
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal(): void {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("  No .env.local found, relying on environment variables.");
  }
}

loadEnvLocal();

import { getSkillBySlug, updateSkill } from "@/lib/db/skills";
import { SEED_SKILL_DEFINITIONS } from "@/lib/db/seed-data/skill-definitions";

type SyncResult = {
  updated: string[];
  skipped: string[];
  notFound: string[];
  errors: Array<{ slug: string; error: string }>;
};

async function syncSkillContent(): Promise<SyncResult> {
  const result: SyncResult = {
    updated: [],
    skipped: [],
    notFound: [],
    errors: [],
  };

  console.log(`\nSyncing ${SEED_SKILL_DEFINITIONS.length} skills...\n`);

  for (const def of SEED_SKILL_DEFINITIONS) {
    try {
      const existing = await getSkillBySlug(def.slug);

      if (!existing) {
        console.log(`  [miss]  ${def.slug} — not in database, skipping`);
        result.notFound.push(def.slug);
        continue;
      }

      const bodyChanged = existing.body !== def.body;
      const docsChanged =
        JSON.stringify(existing.agentDocs) !== JSON.stringify(def.agentDocs ?? {});
      const descChanged = existing.description !== def.description;
      const tagsChanged =
        JSON.stringify(existing.tags) !== JSON.stringify(def.tags ?? []);

      if (!bodyChanged && !docsChanged && !descChanged && !tagsChanged) {
        console.log(`  [skip]  ${def.slug} — already up to date`);
        result.skipped.push(def.slug);
        continue;
      }

      const changes: string[] = [];
      if (bodyChanged) changes.push("body");
      if (docsChanged) changes.push("agent_docs");
      if (descChanged) changes.push("description");
      if (tagsChanged) changes.push("tags");

      await updateSkill(def.slug, {
        body: def.body,
        description: def.description,
        tags: def.tags,
        agentDocs: def.agentDocs ?? {},
      });

      console.log(`  [ok]    ${def.slug} — updated: ${changes.join(", ")}`);
      result.updated.push(def.slug);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [err]   ${def.slug} — ${msg}`);
      result.errors.push({ slug: def.slug, error: msg });
    }
  }

  return result;
}

function printSummary(result: SyncResult): void {
  console.log("\n=== Sync Summary ===");
  console.log(`  Updated:   ${result.updated.length}`);
  console.log(`  Skipped:   ${result.skipped.length}`);
  console.log(`  Not found: ${result.notFound.length}`);
  console.log(`  Errors:    ${result.errors.length}`);
  console.log(`  Total:     ${SEED_SKILL_DEFINITIONS.length}`);

  if (result.notFound.length > 0) {
    console.log(`\n  Missing slugs: ${result.notFound.join(", ")}`);
    console.log("  Run 'npx tsx lib/db/seed-skills.ts' first to insert them.");
  }

  if (result.errors.length > 0) {
    console.log("\n  Errors:");
    for (const { slug, error } of result.errors) {
      console.log(`    ${slug}: ${error}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== Skill Content Sync ===");
  console.log("Pushes expanded bodies + agent docs to Supabase.\n");

  const result = await syncSkillContent();
  printSummary(result);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exit(1);
  });
