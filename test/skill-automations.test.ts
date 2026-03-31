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
    },
    automations: [],
  });

  assert.equal(summaries.length, 1);
  assert.equal(summaries[0]?.id, "frontend-frontier");
  assert.equal(
    summaries[0]?.schedule,
    "FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
  );
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
  assert.equal(summaries[0]?.schedule, "");
  assert.equal(summaries[0]?.status, "PAUSED");
});
