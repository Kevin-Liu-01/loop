import assert from "node:assert/strict";
import test from "node:test";

import { buildAutomationPrompt, buildAutomationToml } from "@/lib/automations";
import { formatAutomationSchedule } from "@/lib/format";

test("buildAutomationPrompt anchors the task to the selected skill", () => {
  const prompt = buildAutomationPrompt(
    {
      slug: "frontend-loop",
      title: "Frontend Loop"
    },
    "Look for routing and metadata changes."
  );

  assert.match(prompt, /Use \$frontend-loop/);
  assert.match(prompt, /routing and metadata changes/);
});

test("buildAutomationToml writes a stable automation document", () => {
  const toml = buildAutomationToml(
    {
      name: "Frontend refresh",
      skillSlug: "frontend-loop",
      cadence: "daily-9",
      note: "Look for metadata updates.",
      status: "ACTIVE"
    },
    {
      slug: "frontend-loop",
      title: "Frontend Loop"
    },
    "frontend-refresh"
  );

  assert.match(toml, /id = "frontend-refresh"/);
  assert.match(toml, /rrule = "FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0"/);
  assert.match(toml, /Use \$frontend-loop/);
});

test("formatAutomationSchedule turns known rules into human labels", () => {
  assert.equal(formatAutomationSchedule("FREQ=HOURLY;INTERVAL=6"), "Every 6 hours");
  assert.equal(formatAutomationSchedule("FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0"), "Monday · 9:00 AM");
});
