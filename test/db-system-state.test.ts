import assert from "node:assert/strict";
import test from "node:test";

import type {
  LoopRunRecord,
  RefreshRunRecord,
  UsageEventRecord,
  BillingEventRecord,
  StripeSubscriptionRecord
} from "@/lib/types";

test("LoopRunRecord type satisfies required shape for DB mapping", () => {
  const record: LoopRunRecord = {
    id: "test-loop-run-001",
    slug: "test-skill",
    title: "Test Skill",
    origin: "user",
    trigger: "manual",
    status: "success",
    startedAt: "2026-03-28T00:00:00.000Z",
    finishedAt: "2026-03-28T00:01:00.000Z",
    previousVersionLabel: "v1",
    nextVersionLabel: "v2",
    href: "/skills/test-skill/v2",
    summary: "Test loop run completed.",
    whatChanged: "Updated section headers.",
    bodyChanged: true,
    changedSections: ["Purpose"],
    editorModel: "gpt-4.1-mini",
    sourceCount: 2,
    signalCount: 5,
    messages: ["Started scanning.", "Completed."],
    sources: [],
    diffLines: [{ type: "added", value: "+ New line" }]
  };

  assert.equal(record.id, "test-loop-run-001");
  assert.equal(record.status, "success");
  assert.equal(record.trigger, "manual");
  assert.equal(record.bodyChanged, true);
  assert.deepEqual(record.changedSections, ["Purpose"]);
});

test("RefreshRunRecord type satisfies DB mapping shape", () => {
  const record: RefreshRunRecord = {
    id: "test-refresh-001",
    status: "success",
    startedAt: "2026-03-28T00:00:00.000Z",
    finishedAt: "2026-03-28T00:10:00.000Z",
    generatedAt: "2026-03-28T00:09:00.000Z",
    generatedFrom: "remote-refresh",
    writeLocal: false,
    uploadBlob: false,
    refreshCategorySignals: true,
    refreshUserSkills: true,
    refreshImportedSkills: true,
    focusSkillSlugs: [],
    focusImportedSkillSlugs: [],
    skillCount: 42,
    categoryCount: 7,
    dailyBriefCount: 7
  };

  assert.equal(record.status, "success");
  assert.equal(record.skillCount, 42);
  assert.equal(record.writeLocal, false);
});

test("UsageEventRecord type satisfies DB mapping shape", () => {
  const record: UsageEventRecord = {
    id: "test-usage-001",
    at: "2026-03-28T00:00:00.000Z",
    kind: "api_call",
    source: "api",
    label: "Test API call",
    route: "/api/skills",
    method: "GET",
    status: 200,
    durationMs: 150,
    ok: true
  };

  assert.equal(record.kind, "api_call");
  assert.equal(record.status, 200);
  assert.equal(record.durationMs, 150);
});

test("BillingEventRecord type satisfies DB mapping shape", () => {
  const record: BillingEventRecord = {
    id: "test-billing-001",
    type: "checkout.session.completed",
    createdAt: "2026-03-28T00:00:00.000Z",
    livemode: false,
    customerId: "cus_test123",
    customerEmail: "test@example.com",
    subscriptionId: "sub_test123",
    planSlug: "pro",
    status: "active",
    amount: 2900,
    currency: "usd"
  };

  assert.equal(record.type, "checkout.session.completed");
  assert.equal(record.amount, 2900);
});

test("StripeSubscriptionRecord type satisfies DB mapping shape", () => {
  const record: StripeSubscriptionRecord = {
    id: "sub_test123",
    customerId: "cus_test123",
    customerEmail: "test@example.com",
    planSlug: "pro",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-04-28T00:00:00.000Z",
    updatedAt: "2026-03-28T00:00:00.000Z"
  };

  assert.equal(record.status, "active");
  assert.equal(record.cancelAtPeriodEnd, false);
});
