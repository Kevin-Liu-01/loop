import assert from "node:assert/strict";
import test from "node:test";

import { canSessionEditSkill, getSkillPublisherName } from "@/lib/skill-authoring";

test("canSessionEditSkill allows the verified attached author", () => {
  const allowed = canSessionEditSkill(
    {
      authorId: "author-loop",
      creatorClerkUserId: undefined
    },
    {
      userId: "user_123",
      email: "kk23907751@gmail.com",
      stripeConnectAccountId: null
    },
    {
      id: "author-loop",
      slug: "loop",
      displayName: "Loop",
      bio: "",
      verified: true,
      isOfficial: true,
      badgeLabel: "Verified"
    }
  );

  assert.equal(allowed, true);
});

test("canSessionEditSkill falls back to the legacy creator id", () => {
  const allowed = canSessionEditSkill(
    {
      authorId: undefined,
      creatorClerkUserId: "user_legacy"
    },
    {
      userId: "user_legacy",
      email: "someone@example.com",
      stripeConnectAccountId: null
    },
    null
  );

  assert.equal(allowed, true);
});

test("getSkillPublisherName prefers the attached author profile", () => {
  const name = getSkillPublisherName({
    ownerName: "Fallback Name",
    author: {
      id: "author-loop",
      slug: "loop",
      displayName: "Loop",
      bio: "",
      verified: true,
      isOfficial: true,
      badgeLabel: "Verified"
    }
  });

  assert.equal(name, "Loop");
});
