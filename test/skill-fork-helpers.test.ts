import assert from "node:assert/strict";
import test from "node:test";

import { buildPausedAutomationFromSource } from "@/lib/skill-fork-helpers";

test("buildPausedAutomationFromSource copies source automation but forces paused state", () => {
  const result = buildPausedAutomationFromSource({
    slug: "react-patterns",
    title: "React Patterns",
    automation: {
      enabled: true,
      cadence: "weekly",
      status: "active",
      prompt: "Watch for new patterns in the React ecosystem.",
      lastRunAt: "2026-03-30T12:00:00Z",
      consecutiveFailures: 2,
      preferredModel: "gpt-4o",
    },
  });

  assert.equal(result.enabled, false);
  assert.equal(result.status, "paused");
  assert.equal(result.cadence, "weekly");
  assert.equal(result.prompt, "Watch for new patterns in the React ecosystem.");
  assert.equal(result.preferredModel, "gpt-4o");
  assert.equal(result.lastRunAt, undefined);
  assert.equal(result.consecutiveFailures, undefined);
});

test("buildPausedAutomationFromSource creates default paused automation when source has none", () => {
  const result = buildPausedAutomationFromSource({
    slug: "my-custom-skill",
    title: "My Custom Skill",
    automation: undefined,
  });

  assert.equal(result.enabled, false);
  assert.equal(result.status, "paused");
  assert.equal(result.cadence, "daily");
  assert.ok(result.prompt.includes("$my-custom-skill"));
  assert.equal(result.lastRunAt, undefined);
  assert.equal(result.preferredModel, undefined);
});
