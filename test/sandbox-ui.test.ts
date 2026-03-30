import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  sandboxToolbarControl,
  sandboxToolbarLabel,
  sandboxInspectorPanel,
  sandboxContextCard,
  sandboxContextCardActive,
} from "@/lib/sandbox-ui";

describe("sandbox-ui tokens", () => {
  it("exports toolbar class strings", () => {
    assert.ok(sandboxToolbarControl.includes("rounded-lg"));
    assert.ok(sandboxToolbarLabel.includes("uppercase"));
  });

  it("exports inspector panel class string", () => {
    assert.ok(sandboxInspectorPanel.includes("border-l"));
    assert.ok(sandboxInspectorPanel.includes("320px"));
  });

  it("exports context card tokens", () => {
    assert.ok(sandboxContextCard.includes("rounded-lg"));
    assert.ok(sandboxContextCard.includes("border"));
    assert.ok(sandboxContextCardActive.includes("accent"));
  });
});
