import assert from "node:assert/strict";
import test from "node:test";

import { buildAgentContext } from "@/lib/agents";
import { buildImportedSkillDraft, buildImportedSkillRecord, extractMcpDocuments } from "@/lib/imports";
import type { SkillwireSnapshot } from "@/lib/types";

test("buildImportedSkillDraft normalizes markdown imports into remote skills", () => {
  const skill = buildImportedSkillDraft(
    "# MCP Notes\n\nTrack agent tooling.\n\n## Workflow\n\n1. Read.\n2. Synthesize.\n",
    "https://raw.githubusercontent.com/acme/skill-pack/main/SKILL.md",
    new Date("2026-03-27T12:00:00.000Z")
  );

  assert.equal(skill.slug.startsWith("mcp-notes-"), true);
  assert.equal(skill.visibility, "public");
  assert.equal(skill.syncEnabled, true);
  assert.equal(skill.ownerName, "Raw githubusercontent");
  assert.equal(skill.version, 1);
  assert.deepEqual(skill.versions.map((version) => version.version), [1]);
});

test("extractMcpDocuments parses common mcpServers JSON", () => {
  const documents = extractMcpDocuments(
    JSON.stringify({
      mcpServers: {
        linear: {
          url: "https://mcp.linear.app/mcp",
          description: "Linear tools"
        },
        playwright: {
          command: "npx",
          args: ["-y", "@playwright/mcp@latest"]
        }
      }
    }),
    "https://example.com/mcp.json"
  );

  assert.equal(documents.length, 2);
  assert.equal(documents[0]?.manifestUrl, "https://example.com/mcp.json");
  assert.ok(documents.some((entry) => entry.transport === "http"));
  assert.ok(documents.some((entry) => entry.transport === "stdio"));
});

test("buildAgentContext includes selected skills and mcps", () => {
  const snapshot = {
    generatedAt: "2026-03-27T12:00:00.000Z",
    generatedFrom: "local-scan",
    categories: [],
    skills: [
      {
        slug: "frontend-frontier",
        title: "Frontend Frontier",
        description: "Design engineering skill.",
        category: "frontend",
        accent: "signal-red",
        featured: true,
        visibility: "public",
        origin: "repo",
        href: "/skills/frontend-frontier/v1",
        path: "/tmp/frontend",
        relativeDir: "tmp/frontend",
        updatedAt: "2026-03-27T12:00:00.000Z",
        tags: ["frontend"],
        headings: [],
        body: "Do sharp frontend work.",
        excerpt: "Do sharp frontend work.",
        references: [],
        version: 1,
        versionLabel: "v1",
        availableVersions: [
          {
            version: 1,
            label: "v1",
            updatedAt: "2026-03-27T12:00:00.000Z"
          }
        ],
        agents: [
          {
            provider: "skillwire",
            displayName: "Default",
            shortDescription: "default",
            defaultPrompt: "Use $frontend-frontier",
            path: "/tmp/default"
          }
        ],
        automations: []
      }
    ],
    mcps: [
      {
        id: "linear",
        name: "Linear",
        description: "Issue tracking MCP.",
        manifestUrl: "https://example.com/mcp.json",
        transport: "http",
        url: "https://mcp.linear.app/mcp",
        args: [],
        envKeys: [],
        tags: ["linear"],
        raw: "{}",
        createdAt: "2026-03-27T12:00:00.000Z",
        updatedAt: "2026-03-27T12:00:00.000Z",
        version: 1,
        versionLabel: "v1",
        versions: [
          {
            version: 1,
            updatedAt: "2026-03-27T12:00:00.000Z",
            description: "Issue tracking MCP.",
            manifestUrl: "https://example.com/mcp.json",
            transport: "http",
            url: "https://mcp.linear.app/mcp",
            args: [],
            envKeys: [],
            tags: ["linear"],
            raw: "{}"
          }
        ]
      }
    ],
    automations: [],
    dailyBriefs: [],
    plans: []
  } satisfies SkillwireSnapshot;

  const context = buildAgentContext(snapshot, {
    providerId: "gateway",
    model: "openai/gpt-5.4-mini",
    selectedSkillSlugs: ["frontend-frontier"],
    selectedMcpIds: ["linear"],
    systemPrompt: "Use attached context first."
  });

  assert.match(context, /Frontend Frontier/);
  assert.match(context, /Version: v1/);
  assert.match(context, /MCP: Linear/);
  assert.match(context, /Use attached context first/);
});

test("buildImportedSkillRecord exposes a versioned href", () => {
  const draft = buildImportedSkillDraft(
    "# Containers Radar\n\nTrack container platform shifts.\n",
    "https://example.com/containers.md",
    new Date("2026-03-27T12:00:00.000Z")
  );

  const record = buildImportedSkillRecord(draft);

  assert.equal(record.href, `/skills/${draft.slug}/v1`);
  assert.equal(record.path, "https://example.com/containers.md");
  assert.equal(record.versionLabel, "v1");
});
