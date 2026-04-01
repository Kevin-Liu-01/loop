import assert from "node:assert/strict";
import test from "node:test";

import { buildSearchIndex, searchIndex } from "@/lib/search";
import type { LoopSnapshot, SearchHit } from "@/lib/types";

test("searchIndex ranks matching skills and categories from the persisted corpus", () => {
  const snapshot = {
    generatedAt: "2026-03-27T12:00:00.000Z",
    generatedFrom: "local-scan",
    categories: [
      {
        slug: "frontend",
        title: "Frontend",
        strapline: "UI systems",
        description: "Frontend category",
        hero: "Frontend hero",
        accent: "signal-red",
        status: "live",
        keywords: ["frontend", "react"],
        sources: []
      }
    ],
    skills: [
      {
        slug: "frontend-frontier",
        title: "Frontend Frontier",
        description: "Sharp frontend systems and motion.",
        category: "frontend",
        accent: "signal-red",
        featured: true,
        visibility: "public",
        origin: "repo",
        href: "/skills/frontend-frontier/v1",
        path: "/tmp/frontend",
        relativeDir: "tmp/frontend",
        updatedAt: "2026-03-27T12:00:00.000Z",
        tags: ["frontend", "motion"],
        headings: [],
        body: "Do sharp frontend work.",
        excerpt: "Do sharp frontend work.",
        references: [],
        agents: [],
        automations: [],
        version: 1,
        versionLabel: "v1",
        availableVersions: [
          {
            version: 1,
            label: "v1",
            updatedAt: "2026-03-27T12:00:00.000Z"
          }
        ]
      }
    ],
    mcps: [],
    automations: [],
    dailyBriefs: [
      {
        slug: "frontend",
        title: "Frontend brief",
        summary: "Frontend changed.",
        whatChanged: "React shipped a thing.",
        experiments: ["Ship it"],
        items: [],
        generatedAt: "2026-03-27T12:00:00.000Z"
      }
    ],
    plans: []
  } satisfies LoopSnapshot;

  const index = buildSearchIndex(snapshot);
  const hits = searchIndex(index, "frontend");

  assert.equal(hits[0]?.kind, "skill");
  assert.equal(hits[0]?.title, "Frontend Frontier");
  assert.ok(hits.some((hit: SearchHit) => hit.kind === "category"));
});

test("searchIndex can return only skills for blank queries", () => {
  const snapshot = {
    generatedAt: "2026-03-27T12:00:00.000Z",
    generatedFrom: "local-scan",
    categories: [
      {
        slug: "frontend",
        title: "Frontend",
        strapline: "UI systems",
        description: "Frontend category",
        hero: "Frontend hero",
        accent: "signal-red",
        status: "live",
        keywords: ["frontend", "react"],
        sources: []
      }
    ],
    skills: [
      {
        slug: "frontend-frontier",
        title: "Frontend Frontier",
        description: "Sharp frontend systems and motion.",
        category: "frontend",
        accent: "signal-red",
        featured: true,
        visibility: "public",
        origin: "repo",
        href: "/skills/frontend-frontier/v1",
        path: "/tmp/frontend",
        relativeDir: "tmp/frontend",
        updatedAt: "2026-03-27T12:00:00.000Z",
        tags: ["frontend", "motion"],
        headings: [],
        body: "Do sharp frontend work.",
        excerpt: "Do sharp frontend work.",
        references: [],
        agents: [],
        automations: [],
        version: 1,
        versionLabel: "v1",
        availableVersions: [
          {
            version: 1,
            label: "v1",
            updatedAt: "2026-03-27T12:00:00.000Z"
          }
        ]
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
    dailyBriefs: [
      {
        slug: "frontend",
        title: "Frontend brief",
        summary: "Frontend changed.",
        whatChanged: "React shipped a thing.",
        experiments: ["Ship it"],
        items: [],
        generatedAt: "2026-03-27T12:00:00.000Z"
      }
    ],
    plans: []
  } satisfies LoopSnapshot;

  const index = buildSearchIndex(snapshot);
  const hits = searchIndex(index, "", { kind: "skill", limit: 50 });

  assert.deepEqual(hits.map((hit: SearchHit) => hit.kind), ["skill"]);
  assert.equal(hits[0]?.title, "Frontend Frontier");
});
