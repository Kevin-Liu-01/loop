import assert from "node:assert/strict";
import test from "node:test";

import { buildLoopRunResult, buildLoopUpdateTarget } from "@/lib/loop-updates";
import { diffMultilineText } from "@/lib/text-diff";
import { buildUpdateDigest } from "@/lib/update-digest";
import type { SkillRecord } from "@/lib/types";

test("diffMultilineText marks removed and added lines", () => {
  const diff = diffMultilineText("alpha\nbeta\ngamma", "alpha\nbeta updated\ngamma\ndelta");

  assert.deepEqual(
    diff.map((line) => [line.type, line.value]),
    [
      ["context", "alpha"],
      ["removed", "beta"],
      ["added", "beta updated"],
      ["context", "gamma"],
      ["added", "delta"]
    ]
  );
});

test("buildLoopUpdateTarget normalizes an updateable user loop", () => {
  const target = buildLoopUpdateTarget({
    slug: "frontend-loop",
    title: "Frontend Loop",
    description: "Keep frontend notes current.",
    category: "frontend",
    accent: "signal-blue",
    featured: false,
    visibility: "public",
    origin: "user",
    href: "/skills/frontend-loop/v3",
    path: "skillwire://community-skills/frontend-loop",
    relativeDir: "community/frontend-loop",
    updatedAt: "2026-03-27T12:00:00.000Z",
    tags: ["frontend"],
    headings: [],
    body: "## Purpose",
    excerpt: "Keep frontend notes current.",
    references: [],
    version: 3,
    versionLabel: "v3",
    availableVersions: [
      {
        version: 3,
        label: "v3",
        updatedAt: "2026-03-27T12:00:00.000Z"
      }
    ],
    agents: [],
    automations: [],
    automation: {
      enabled: true,
      cadence: "daily",
      status: "active",
      prompt: "Refresh."
    },
    updates: [
      {
        generatedAt: "2026-03-27T12:00:00.000Z",
        summary: "A fresh frontend delta landed.",
        whatChanged: "Routing notes changed.",
        experiments: [],
        items: [],
        bodyChanged: true,
        changedSections: ["Workflow", "Sources"],
        editorModel: "gpt-5-mini"
      }
    ],
    sources: [
      {
        id: "src-1",
        label: "React Blog",
        url: "https://react.dev/rss.xml",
        kind: "rss",
        tags: ["frontend"]
      }
    ]
  } satisfies SkillRecord);

  assert.equal(target.origin, "user");
  assert.equal(target.automationLabel, "daily active");
  assert.equal(target.sources[0]?.logoUrl.includes("google.com/s2/favicons"), true);
  assert.equal(target.lastSummary, "A fresh frontend delta landed.");
  assert.equal(target.lastWhatChanged, "Routing notes changed.");
  assert.equal(target.lastExperiments?.length, 0);
  assert.deepEqual(target.lastChangedSections, ["Workflow", "Sources"]);
  assert.equal(target.lastBodyChanged, true);
  assert.equal(target.lastEditorModel, "gpt-5-mini");
});

test("buildUpdateDigest turns an update entry into a readable diff target", () => {
  const digest = buildUpdateDigest({
    generatedAt: "2026-03-27T12:00:00.000Z",
    summary: "A new source landed.",
    whatChanged: "The guidance shifted toward clearer routing notes.",
    experiments: ["Rewrite the prompt.", "Trim the stale checklist."],
    bodyChanged: true,
    changedSections: ["Workflow"],
    editorModel: "gpt-5-mini",
    items: [
      {
        title: "React Router notes",
        url: "https://reactrouter.com",
        source: "React Router",
        publishedAt: "2026-03-27T11:00:00.000Z",
        summary: "Router update.",
        tags: ["frontend"]
      }
    ]
  });

  assert.match(digest, /Summary: A new source landed\./);
  assert.match(digest, /What changed: The guidance shifted toward clearer routing notes\./);
  assert.match(digest, /Body changed: yes/);
  assert.match(digest, /Editor: gpt-5-mini/);
  assert.match(digest, /Changed sections: Workflow/);
  assert.match(digest, /Experiments:/);
  assert.match(digest, /Signals:/);
});

test("buildLoopRunResult turns a stored run back into a visible revision result", () => {
  const result = buildLoopRunResult({
    id: "run-1",
    slug: "frontend-loop",
    title: "Frontend Loop",
    origin: "user",
    trigger: "automation",
    status: "success",
    startedAt: "2026-03-27T12:00:00.000Z",
    finishedAt: "2026-03-27T12:05:00.000Z",
    previousVersionLabel: "v2",
    nextVersionLabel: "v3",
    href: "/skills/frontend-loop/v3",
    summary: "A new body revision landed.",
    whatChanged: "The workflow section was rewritten.",
    bodyChanged: true,
    changedSections: ["Workflow"],
    editorModel: "gpt-5-mini",
    sourceCount: 1,
    signalCount: 2,
    messages: [],
    sources: [
      {
        id: "source-1",
        label: "React",
        url: "https://react.dev/rss.xml",
        kind: "rss",
        logoUrl: "https://example.com/logo.png",
        status: "done",
        itemCount: 1,
        items: [
          {
            title: "React compiler",
            url: "https://react.dev/blog/compiler",
            source: "React",
            publishedAt: "2026-03-27T11:00:00.000Z",
            summary: "Compiler notes.",
            tags: ["frontend"]
          }
        ]
      }
    ],
    diffLines: [
      {
        type: "added",
        value: "New workflow line",
        rightNumber: 10
      }
    ]
  });

  assert.equal(result?.changed, true);
  assert.equal(result?.bodyChanged, true);
  assert.equal(result?.editorModel, "gpt-5-mini");
  assert.deepEqual(result?.changedSections, ["Workflow"]);
  assert.equal(result?.items?.[0]?.title, "React compiler");
});
