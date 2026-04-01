import assert from "node:assert/strict";
import test from "node:test";

import { formatScheduleLabel, countMonthlyRuns, isScheduledOnDate, formatNextRun, getNextRunDate } from "@/lib/schedule";

// ---------------------------------------------------------------------------
// Schedule label
// ---------------------------------------------------------------------------

test("formatScheduleLabel returns human-readable labels", () => {
  assert.equal(formatScheduleLabel("daily", 9), "Daily · 9:05 AM");
  assert.equal(formatScheduleLabel("daily", 0), "Daily · 12:05 AM");
  assert.equal(formatScheduleLabel("daily", 14), "Daily · 2:05 PM");
  assert.equal(formatScheduleLabel("weekly", 9), "Monday · 9:05 AM");
  assert.equal(formatScheduleLabel("manual", 12), "Manual");
});

test("formatScheduleLabel respects preferredDay for weekly", () => {
  assert.equal(formatScheduleLabel("weekly", 9, 1), "Monday · 9:05 AM");
  assert.equal(formatScheduleLabel("weekly", 9, 3), "Wednesday · 9:05 AM");
  assert.equal(formatScheduleLabel("weekly", 14, 5), "Friday · 2:05 PM");
  assert.equal(formatScheduleLabel("weekly", 9, 0), "Sunday · 9:05 AM");
  assert.equal(formatScheduleLabel("weekly", 9, 6), "Saturday · 9:05 AM");
});

test("formatScheduleLabel ignores preferredDay for daily cadence", () => {
  assert.equal(formatScheduleLabel("daily", 9, 3), "Daily · 9:05 AM");
});

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

test("countMonthlyRuns returns correct counts per cadence", () => {
  assert.equal(countMonthlyRuns("daily", 2026, 2), 31);
  assert.equal(countMonthlyRuns("weekly", 2026, 2), 5);
  assert.equal(countMonthlyRuns("manual", 2026, 2), 0);
});

test("countMonthlyRuns respects preferredDay for weekly", () => {
  // March 2026: Tuesdays are 3, 10, 17, 24, 31 = 5
  assert.equal(countMonthlyRuns("weekly", 2026, 2, 2), 5);
  // March 2026: Fridays are 6, 13, 20, 27 = 4
  assert.equal(countMonthlyRuns("weekly", 2026, 2, 5), 4);
});

test("isScheduledOnDate matches correctly", () => {
  const monday = new Date(2026, 2, 9);
  const tuesday = new Date(2026, 2, 10);

  assert.equal(isScheduledOnDate("daily", monday), true);
  assert.equal(isScheduledOnDate("daily", tuesday), true);
  assert.equal(isScheduledOnDate("weekly", monday), true);
  assert.equal(isScheduledOnDate("weekly", tuesday), false);
  assert.equal(isScheduledOnDate("manual", monday), false);
});

test("isScheduledOnDate respects preferredDay", () => {
  const tuesday = new Date(2026, 2, 10);
  const wednesday = new Date(2026, 2, 11);

  assert.equal(isScheduledOnDate("weekly", tuesday, 2), true);
  assert.equal(isScheduledOnDate("weekly", wednesday, 2), false);
  assert.equal(isScheduledOnDate("weekly", wednesday, 3), true);
});

// ---------------------------------------------------------------------------
// Next run
// ---------------------------------------------------------------------------

test("formatNextRun returns dash for manual cadence", () => {
  assert.equal(formatNextRun("manual", 12), "—");
});

test("formatNextRun returns a non-empty string for active cadences", () => {
  const daily = formatNextRun("daily", 9);
  assert.notEqual(daily, "—");
  assert.ok(daily.length > 0);

  const weekly = formatNextRun("weekly", 9);
  assert.notEqual(weekly, "—");
  assert.ok(weekly.length > 0);
});

test("getNextRunDate for weekly lands on the correct day", () => {
  const fridayRun = getNextRunDate("weekly", 9, 5);
  assert.ok(fridayRun);
  assert.equal(fridayRun.getUTCDay(), 5);

  const sundayRun = getNextRunDate("weekly", 9, 0);
  assert.ok(sundayRun);
  assert.equal(sundayRun.getUTCDay(), 0);
});

// ---------------------------------------------------------------------------
// Seed data validation
// ---------------------------------------------------------------------------

test("all skill source configs have at least 4 sources", async () => {
  const { SKILL_SOURCE_CONFIGS } = await import("@/lib/db/seed-data/skill-sources");

  const underSourced = SKILL_SOURCE_CONFIGS.filter((cfg) => cfg.sources.length < 4);
  assert.equal(
    underSourced.length,
    0,
    `Skills with fewer than 4 sources: ${underSourced.map((c) => `${c.slug} (${c.sources.length})`).join(", ")}`
  );
});

test("all skill source configs have non-empty actionable prompts", async () => {
  const { SKILL_SOURCE_CONFIGS } = await import("@/lib/db/seed-data/skill-sources");

  const generic = SKILL_SOURCE_CONFIGS.filter(
    (cfg) => cfg.automation.prompt.length < 50 || /^Refresh \w+ skill\.$/.test(cfg.automation.prompt)
  );
  assert.equal(
    generic.length,
    0,
    `Skills with generic prompts: ${generic.map((c) => c.slug).join(", ")}`
  );
});
