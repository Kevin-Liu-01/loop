import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SETTINGS_BASE_PATH, SETTINGS_NAV_ITEMS, settingsPath } from "@/lib/settings-nav";

describe("SETTINGS_NAV_ITEMS", () => {
  it("has unique ids aligned with route segments", () => {
    const ids = SETTINGS_NAV_ITEMS.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(ids, [
      "automations",
      "health",
      "refresh",
      "imports",
      "subscription",
      "connect",
    ]);
  });

  it("has non-empty labels", () => {
    for (const item of SETTINGS_NAV_ITEMS) {
      assert.ok(item.label.trim().length > 0);
    }
  });
});

describe("settingsPath", () => {
  it("builds paths under the settings base", () => {
    assert.equal(settingsPath("subscription"), `${SETTINGS_BASE_PATH}/subscription`);
    assert.equal(settingsPath("health"), `${SETTINGS_BASE_PATH}/health`);
  });
});
