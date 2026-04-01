/**
 * Comprehensive catalog overhaul for skills + MCPs.
 *
 * Usage:
 *   source <(sed 's/^/export /' .env.local) && npx tsx lib/db/seed-platform-overhaul.ts
 */

import { getServerSupabase } from "@/lib/db/client";
import { listSkills, updateSkill } from "@/lib/db/skills";
import { listMcps, upsertMcp } from "@/lib/db/mcps";
import { SKILL_SOURCE_CONFIGS } from "@/lib/db/seed-data/skill-sources";
import {
  DIRECT_TRANSPLANT_SKILLS,
  FEATURED_REASON_OVERRIDES,
  FEATURED_SKILL_ORDER,
  LOCAL_UPSTREAM_SKILLS,
  MCP_NORMALIZATION_OVERRIDES,
  QUALITY_SCORE_OVERRIDES,
  SKILL_UPSTREAM_LINKS,
  TRUSTED_SKILL_SOURCE_SEEDS,
} from "@/lib/db/seed-data/catalog-overhaul";
import { findSkillFiles, parseSkill, CODEX_ROOT } from "@/lib/content";
import { slugify } from "@/lib/markdown";
import { getMcpIcon, getSkillIcon } from "@/lib/skill-icons";
import type {
  ImportedMcpDocument,
  SkillRecord,
  SkillResearchProfile,
  SkillUpstreamRecord,
} from "@/lib/types";

function upsertManagedSection(body: string, title: string, sectionBody: string): string {
  const trimmed = body.trim();
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionPattern = new RegExp(`\\n## ${escapedTitle}\\n[\\s\\S]*?(?=\\n## |$)`, "m");
  const replacement = `\n## ${title}\n${sectionBody.trim()}\n`;

  if (sectionPattern.test(trimmed)) {
    return trimmed.replace(sectionPattern, replacement).trim();
  }

  return `${trimmed}\n\n## ${title}\n${sectionBody.trim()}`.trim();
}

function buildFeaturedRank(slug: string): number {
  const index = FEATURED_SKILL_ORDER.indexOf(slug);
  if (index === -1) {
    return 0;
  }

  return FEATURED_SKILL_ORDER.length - index;
}

function buildQualityScore(skill: SkillRecord, upstreams: SkillUpstreamRecord[]): number {
  if (QUALITY_SCORE_OVERRIDES[skill.slug]) {
    return QUALITY_SCORE_OVERRIDES[skill.slug] ?? 80;
  }

  const officialSources = (skill.sources ?? []).filter((source) => source.trust === "official" || source.trust === "standards").length;
  const discoverSources = (skill.sources ?? []).filter((source) => source.mode === "discover" || source.mode === "search").length;

  return Math.min(
    97,
    70 +
      upstreams.length * 4 +
      officialSources * 3 +
      discoverSources * 2 +
      Math.min((skill.sources ?? []).length, 6)
  );
}

function buildResearchProfile(skill: SkillRecord, upstreams: SkillUpstreamRecord[]): SkillResearchProfile {
  const sources = skill.sources ?? [];
  const discoveryQueries = Array.from(
    new Set(
      sources.flatMap((source) => source.searchQueries ?? [])
    )
  ).slice(0, 8);

  const officialCount = sources.filter((source) => source.trust === "official" || source.trust === "standards").length;
  const discoveryCount = sources.filter((source) => source.mode === "discover" || source.mode === "search").length;

  return {
    summary:
      upstreams.length > 0
        ? `${skill.title} now combines ${sources.length} tracked sources with ${upstreams.length} trusted upstream skill packs. Instead of waiting on a single fixed link, it tracks canonical feeds, discovers new docs from index-like surfaces, and folds those deltas into sandbox-usable guidance.`
        : `${skill.title} now treats its source set as a research system: canonical feeds for concrete deltas, index-like sources for discovery, and query hints for ranking.`,
    process: [
      {
        title: "Track canonical signals",
        detail: `Monitor ${Math.max(sources.length - discoveryCount, 0)} feed-like sources for release notes, changelog entries, and durable upstream deltas.`,
      },
      {
        title: "Discover net-new docs and leads",
        detail: `Scan ${discoveryCount} discovery-oriented sources such as docs indexes and sitemaps, then rank extracted links against explicit query hints instead of trusting nav order.`,
      },
      {
        title: "Transplant from trusted upstreams",
        detail:
          upstreams.length > 0
            ? `Fold implementation patterns from ${upstreams.map((upstream) => upstream.title).join(", ")} so the skill inherits a real operating model instead of boilerplate prose.`
            : "Keep the skill grounded in trusted source deltas even when there is no direct upstream skill pack to transplant from.",
      },
      {
        title: "Keep the sandbox honest",
        detail: "Ship prompts, MCP recommendations, and automation language that can actually be executed in Loop's sandbox instead of abstract advice theater.",
      },
    ],
    discoveryQueries,
    featuredReason:
      FEATURED_REASON_OVERRIDES[skill.slug] ??
      (officialCount >= 2
        ? `${skill.title} has unusually strong source quality and broad utility, so it deserves prominent placement.`
        : undefined),
  };
}

function buildDiscoverySection(skill: SkillRecord): string {
  const sources = skill.sources ?? [];
  if (sources.length === 0) {
    return "No sources configured.";
  }

  return sources
    .map((source) => {
      const metadata = [source.kind, source.mode, source.trust].filter(Boolean).join(" · ");
      return `- [${source.label}](${source.url}) – ${metadata}. ${source.rationale ?? "Tracked for material changes."}`;
    })
    .join("\n");
}

function buildUpstreamSection(upstreams: SkillUpstreamRecord[]): string {
  if (upstreams.length === 0) {
    return "- No direct upstream skill pack is linked yet. Keep the skill grounded in source deltas and concrete examples.";
  }

  return upstreams
    .map((upstream) => `- [${upstream.title}](${upstream.upstreamUrl}) – ${upstream.description}`)
    .join("\n");
}

function buildSandboxSection(skill: SkillRecord): string {
  const prompt = skill.automation?.prompt ?? `Refresh ${skill.title} from tracked sources and update the operating guidance.`;

  return [
    "- Attach this skill before asking the agent to design, implement, audit, or refresh work in this domain.",
    "- Pair it with sandbox-compatible MCPs when external systems are involved so the agent has real tools, not decorative configuration.",
    `- Default automation brief: ${prompt}`,
  ].join("\n");
}

function buildBody(baseBody: string, skill: SkillRecord, upstreams: SkillUpstreamRecord[]): string {
  const withDiscovery = upsertManagedSection(baseBody, "Discovery engine", buildDiscoverySection(skill));
  const withUpstreams = upsertManagedSection(withDiscovery, "Trusted upstreams", buildUpstreamSection(upstreams));
  return upsertManagedSection(withUpstreams, "Sandbox workflow", buildSandboxSection(skill));
}

function buildPackageName(mcp: ImportedMcpDocument): string | undefined {
  if (mcp.command === "npx" && mcp.args.length >= 2 && mcp.args[0] === "-y") {
    return mcp.args[1];
  }

  if (mcp.command === "uvx" && mcp.args.length > 0) {
    return mcp.args[0]?.replace(/@latest$/, "");
  }

  const npmMatch = /npmjs\.com\/package\/([^/?#]+)/.exec(mcp.manifestUrl);
  if (npmMatch) {
    return npmMatch[1];
  }

  return undefined;
}

function buildInstallStrategy(mcp: ImportedMcpDocument): ImportedMcpDocument["installStrategy"] {
  if (mcp.transport === "http") {
    return "remote-http";
  }

  if (mcp.command === "npx") {
    return "npx";
  }

  if (mcp.command === "uvx") {
    return "uvx";
  }

  if (mcp.command) {
    return "binary";
  }

  return "manual";
}

function buildAuthType(mcp: ImportedMcpDocument): ImportedMcpDocument["authType"] {
  if (mcp.envKeys.length === 0) {
    return "none";
  }

  if (mcp.envKeys.some((key) => key.includes("TOKEN") || key.includes("PAT"))) {
    return "pat";
  }

  return "api-key";
}

function defaultSandboxSupport(mcp: ImportedMcpDocument): boolean {
  return (
    (mcp.transport === "stdio" && typeof mcp.command === "string" && mcp.command.length > 0) ||
    (mcp.transport === "http" && typeof mcp.url === "string" && mcp.url.length > 0)
  );
}

function normalizeMcp(mcp: ImportedMcpDocument): ImportedMcpDocument {
  const override = MCP_NORMALIZATION_OVERRIDES[mcp.name];
  const installStrategy = override?.installStrategy ?? buildInstallStrategy(mcp);
  const authType = override?.authType ?? buildAuthType(mcp);
  const sandboxSupported = override?.sandboxSupported ?? defaultSandboxSupport(mcp);
  const verificationStatus =
    override?.verificationStatus ??
    (sandboxSupported ? "partial" : "broken");
  const icon = getMcpIcon(mcp.name, mcp.homepageUrl);

  return {
    ...mcp,
    slug: mcp.slug ?? slugify(mcp.name),
    docsUrl: override?.docsUrl ?? mcp.docsUrl ?? mcp.homepageUrl ?? mcp.manifestUrl,
    packageName: mcp.packageName ?? buildPackageName(mcp),
    packageRegistry:
      mcp.packageRegistry ??
      (mcp.manifestUrl.includes("npmjs.com") ? "npm" : mcp.manifestUrl.includes("github.com") ? "github" : undefined),
    installStrategy,
    authType,
    verificationStatus,
    sandboxSupported,
    sandboxNotes:
      override?.sandboxNotes ??
      (sandboxSupported
        ? "Runnable in the Loop sandbox once any required credentials are present."
        : "Not exposed in the sandbox because the current config is not verified as runnable."),
    normalizedConfig: {
      transport: mcp.transport,
      url: mcp.url ?? null,
      command: mcp.command ?? null,
      args: mcp.args,
      envKeys: mcp.envKeys,
      headers: mcp.headers ?? {},
    },
    iconUrl: icon.kind === "url" ? icon.url : mcp.iconUrl,
  };
}

async function loadLocalUpstreams(): Promise<Map<string, SkillUpstreamRecord>> {
  const files = await findSkillFiles(CODEX_ROOT);
  const parsed = await Promise.all(files.map((file) => parseSkill(file)));
  const resolved = new Map<string, SkillUpstreamRecord>();

  for (const seed of LOCAL_UPSTREAM_SKILLS) {
    const match = parsed.find((skill) => skill.path.endsWith(seed.matchPathSuffix));
    if (!match) {
      console.warn(`[catalog-overhaul] Missing local upstream for ${seed.slug} (${seed.matchPathSuffix})`);
      continue;
    }

    resolved.set(seed.slug, {
      slug: seed.slug,
      title: seed.title,
      description: seed.description || match.description,
      category: seed.category,
      upstreamUrl: seed.upstreamUrl,
      upstreamKind: seed.upstreamKind,
      sourceId: seed.sourceId,
      logoUrl: match.iconUrl,
      tags: Array.from(new Set([...seed.tags, ...match.tags])).slice(0, 8),
      body: match.body,
    });
  }

  return resolved;
}

async function seedTrustedSourcesAndUpstreams(
  upstreams: Map<string, SkillUpstreamRecord>
): Promise<void> {
  const db = getServerSupabase();

  const { error: sourceError } = await db
    .from("trusted_skill_sources")
    .upsert(
      TRUSTED_SKILL_SOURCE_SEEDS.map((source) => ({
        id: source.id,
        slug: source.slug,
        name: source.name,
        trust_tier: source.trustTier,
        source_type: source.sourceType,
        homepage_url: source.homepageUrl,
        repo_url: source.repoUrl ?? null,
        logo_url: source.logoUrl ?? null,
        discovery_mode: source.discoveryMode,
        search_queries: source.searchQueries,
        tags: source.tags,
      })) as never,
      { onConflict: "id" }
    );

  if (sourceError) {
    throw sourceError;
  }

  const upstreamRows = Array.from(upstreams.values()).map((upstream) => ({
    slug: upstream.slug,
    title: upstream.title,
    description: upstream.description,
    category: upstream.category,
    source_id: upstream.sourceId,
    upstream_url: upstream.upstreamUrl,
    upstream_kind: upstream.upstreamKind,
    body: upstream.body,
    logo_url: upstream.logoUrl ?? null,
    tags: upstream.tags,
  }));

  if (upstreamRows.length > 0) {
    const { error: upstreamError } = await db
      .from("skill_upstreams")
      .upsert(upstreamRows as never, { onConflict: "slug" });

    if (upstreamError) {
      throw upstreamError;
    }
  }

  const linkRows = Object.entries(SKILL_UPSTREAM_LINKS).flatMap(([skillSlug, upstreamSlugs]) =>
    upstreamSlugs
      .filter((upstreamSlug) => upstreams.has(upstreamSlug))
      .map((upstreamSlug) => ({
        skill_slug: skillSlug,
        upstream_slug: upstreamSlug,
        relation: DIRECT_TRANSPLANT_SKILLS[skillSlug] === upstreamSlug ? "derived-from" : "secondary",
      }))
  );

  if (linkRows.length > 0) {
    const { error: linkError } = await db
      .from("skill_upstream_links")
      .upsert(linkRows as never, { onConflict: "skill_slug,upstream_slug" });

    if (linkError) {
      throw linkError;
    }
  }
}

async function refreshSkills(upstreams: Map<string, SkillUpstreamRecord>) {
  const skills = await listSkills();
  const sourceConfigBySlug = new Map(SKILL_SOURCE_CONFIGS.map((config) => [config.slug, config]));

  let updated = 0;

  for (const existing of skills) {
    const sourceConfig = sourceConfigBySlug.get(existing.slug);
    const upstreamEntries = (SKILL_UPSTREAM_LINKS[existing.slug] ?? [])
      .map((slug) => upstreams.get(slug))
      .filter((entry): entry is SkillUpstreamRecord => Boolean(entry));
    const transplant = DIRECT_TRANSPLANT_SKILLS[existing.slug]
      ? upstreams.get(DIRECT_TRANSPLANT_SKILLS[existing.slug])
      : undefined;
    const skillIcon = getSkillIcon(existing.slug);
    const draft: SkillRecord = {
      ...existing,
      description: transplant?.description ?? existing.description,
      body: buildBody(transplant?.body ?? existing.body, {
        ...existing,
        description: transplant?.description ?? existing.description,
        sources: sourceConfig?.sources ?? existing.sources,
        automation: sourceConfig?.automation ?? existing.automation,
      }, upstreamEntries),
      tags: Array.from(new Set([...existing.tags, ...upstreamEntries.flatMap((entry) => entry.tags)])),
      sources: sourceConfig?.sources ?? existing.sources,
      automation: sourceConfig?.automation ?? existing.automation,
    };
    const researchProfile = buildResearchProfile(draft, upstreamEntries);

    await updateSkill(existing.slug, {
      title: draft.title,
      description: draft.description,
      body: draft.body,
      tags: draft.tags,
      sources: draft.sources,
      automation: draft.automation,
      featured: buildFeaturedRank(existing.slug) > 0 || existing.featured,
      featuredRank: buildFeaturedRank(existing.slug),
      qualityScore: buildQualityScore(draft, upstreamEntries),
      researchProfile,
      iconUrl: skillIcon.kind === "url" ? skillIcon.url : existing.iconUrl,
    });

    updated++;
    console.log(`  [skill] ${existing.slug}`);
  }

  return updated;
}

async function refreshMcps() {
  const mcps = await listMcps();
  let updated = 0;

  for (const mcp of mcps) {
    await upsertMcp(normalizeMcp(mcp));
    updated++;
    console.log(`  [mcp]   ${mcp.name}`);
  }

  return updated;
}

async function main() {
  console.log("=== Loop Catalog Overhaul ===");
  const upstreams = await loadLocalUpstreams();

  console.log(`\n[1/3] Seeding trusted sources and upstream links (${upstreams.size} upstreams)...`);
  await seedTrustedSourcesAndUpstreams(upstreams);

  console.log("\n[2/3] Refreshing skills...");
  const updatedSkills = await refreshSkills(upstreams);

  console.log("\n[3/3] Normalizing MCPs...");
  const updatedMcps = await refreshMcps();

  console.log("\n=== Summary ===");
  console.log(`  Skills updated: ${updatedSkills}`);
  console.log(`  MCPs updated:   ${updatedMcps}`);
  console.log(`  Upstreams:      ${upstreams.size}`);
}

main().catch((error) => {
  console.error("Catalog overhaul failed:", error);
  process.exit(1);
});
