import assert from "node:assert/strict";
import test from "node:test";

import { buildSkillAutomationSummaries } from "@/lib/skill-automations";

test("buildSkillAutomationSummaries maps tracked skill automation to editable summaries", () => {
  const summaries = buildSkillAutomationSummaries({
    slug: "frontend-frontier",
    title: "Frontend Frontier",
    origin: "user",
    automation: {
      enabled: true,
      cadence: "daily",
      status: "active",
      prompt: "Refresh the skill from trusted sources.",
      preferredHour: 9,
    },
    automations: [],
  });

  assert.equal(summaries.length, 1);
  assert.equal(summaries[0]?.id, "frontend-frontier");
  assert.equal(summaries[0]?.schedule, "Daily · 9:05 AM");
  assert.equal(summaries[0]?.cadence, "daily");
  assert.equal(summaries[0]?.status, "ACTIVE");
});

test("buildSkillAutomationSummaries preserves paused/manual tracked automations", () => {
  const summaries = buildSkillAutomationSummaries({
    slug: "security-best-practices",
    title: "Security Best Practices",
    origin: "user",
    automation: {
      enabled: false,
      cadence: "manual",
      status: "paused",
      prompt: "Only refresh when asked.",
    },
    automations: [],
  });

  assert.equal(summaries[0]?.id, "security-best-practices");
  assert.equal(summaries[0]?.schedule, "Manual");
  assert.equal(summaries[0]?.cadence, "manual");
  assert.equal(summaries[0]?.status, "PAUSED");
});

test("buildSkillAutomationSummaries includes preferredDay for weekly", () => {
  const summaries = buildSkillAutomationSummaries({
    slug: "weekly-review",
    title: "Weekly Review",
    origin: "user",
    automation: {
      enabled: true,
      cadence: "weekly",
      status: "active",
      prompt: "Run weekly review.",
      preferredHour: 14,
      preferredDay: 5,
    },
    automations: [],
  });

  assert.equal(summaries[0]?.schedule, "Friday · 2:05 PM");
  assert.equal(summaries[0]?.cadence, "weekly");
  assert.equal(summaries[0]?.preferredDay, 5);
});
