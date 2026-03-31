import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getNextWeeklyImportRunUtc } from "@/lib/weekly-import-schedule";

describe("getNextWeeklyImportRunUtc", () => {
  it("returns the upcoming Monday 09:00 UTC after a Tuesday", () => {
    const tuesday = new Date(Date.UTC(2026, 2, 24, 12, 0, 0, 0)); // Tue Mar 24 2026
    const next = getNextWeeklyImportRunUtc(tuesday);
    assert.equal(next.getUTCDay(), 1);
    assert.equal(next.getUTCHours(), 9);
    assert.equal(next.getUTCMinutes(), 0);
    assert.equal(next.getUTCDate(), 30);
  });

  it("returns same Monday 09:00 UTC when now is earlier that Monday", () => {
    const mondayMorning = new Date(Date.UTC(2026, 2, 30, 8, 0, 0, 0));
    const next = getNextWeeklyImportRunUtc(mondayMorning);
    assert.equal(next.toISOString(), "2026-03-30T09:00:00.000Z");
  });
});
