import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserSkillRecord,
  createNextUserSkillVersion,
  createUserSkillDocument,
  isUserSkillAutomationDue,
  updateUserSkillDocument
} from "@/lib/user-skills";

test("createUserSkillDocument normalizes tags, sources, and automation defaults", () => {
  const skill = createUserSkillDocument({
    title: "Infra Notes That Do Not Suck",
    description: "A living infra skill for agent operators who want concrete deploy notes.",
    category: "infra",
    body: "## Purpose\n\nTrack platform shifts.\n\n## Workflow\n\n1. Read.\n2. Synthesize.\n3. Update.\n",
    ownerName: "Ops Team",
    tags: ["Infra", "deploy", "deploy"],
    sourceUrls: ["https://vercel.com/blog/rss.xml", "https://vercel.com/blog/rss.xml"],
    autoUpdate: true,
    automationCadence: "daily",
    automationPrompt: ""
  });

  assert.equal(skill.slug, "infra-notes-that-do-not-suck");
  assert.deepEqual(skill.tags, ["infra", "deploy", "community"]);
  assert.equal(skill.sources.length, 1);
  assert.equal(skill.sources[0]?.kind, "blog");
  assert.equal(skill.automation.enabled, true);
  assert.match(skill.automation.prompt, /\$infra-notes-that-do-not-suck/);
});

test("manual or paused user skills are never due for automation", () => {
  const skill = createUserSkillDocument({
    title: "Container Digest",
    description: "Container updates for operators who would prefer fewer YAML jump scares.",
    category: "containers",
    body: "## Purpose\n\nStay current.\n\n## Workflow\n\n1. Scan sources.\n2. Update notes.\n",
    tags: [],
    sourceUrls: ["https://www.docker.com/blog/feed/"],
    autoUpdate: false,
    automationCadence: "manual",
    automationPrompt: ""
  });

  assert.equal(isUserSkillAutomationDue(skill, new Date("2026-03-27T12:00:00.000Z")), false);
  assert.equal(
    isUserSkillAutomationDue(
      {
        ...skill,
        automation: {
          ...skill.automation,
          enabled: true,
          cadence: "daily",
          status: "paused"
        }
      },
      new Date("2026-03-27T12:00:00.000Z")
    ),
    false
  );
});

test("weekly cadence only fires on Monday UTC", () => {
  const skill = createUserSkillDocument({
    title: "Weekly Digest",
    description: "A weekly skill that should only fire on Mondays.",
    category: "infra",
    body: "## Purpose\n\nTrack weekly shifts.\n\n## Workflow\n\n1. Scan sources.\n2. Update notes.\n",
    tags: [],
    sourceUrls: ["https://vercel.com/blog/rss.xml"],
    autoUpdate: true,
    automationCadence: "weekly",
    automationPrompt: "Weekly refresh."
  });

  const monday = new Date("2026-03-30T12:00:00.000Z");
  const tuesday = new Date("2026-03-31T12:00:00.000Z");
  const sunday = new Date("2026-03-29T12:00:00.000Z");

  assert.equal(monday.getUTCDay(), 1, "sanity: 2026-03-30 is Monday");
  assert.equal(tuesday.getUTCDay(), 2, "sanity: 2026-03-31 is Tuesday");
  assert.equal(sunday.getUTCDay(), 0, "sanity: 2026-03-29 is Sunday");

  assert.equal(isUserSkillAutomationDue(skill, monday), true, "should fire on Monday");
  assert.equal(isUserSkillAutomationDue(skill, tuesday), false, "should not fire on Tuesday");
  assert.equal(isUserSkillAutomationDue(skill, sunday), false, "should not fire on Sunday");
});

test("skills with 3+ consecutive failures are skipped", () => {
  const skill = createUserSkillDocument({
    title: "Broken Skill",
    description: "A skill that keeps failing.",
    category: "infra",
    body: "## Purpose\n\nFail.\n\n## Workflow\n\n1. Fail.\n",
    tags: [],
    sourceUrls: ["https://example.com/feed.xml"],
    autoUpdate: true,
    automationCadence: "daily",
    automationPrompt: "Refresh."
  });

  const withFailures = {
    ...skill,
    automation: {
      ...skill.automation,
      consecutiveFailures: 3
    }
  };

  assert.equal(
    isUserSkillAutomationDue(withFailures, new Date("2026-03-30T12:00:00.000Z")),
    false,
    "should skip after 3 failures"
  );

  const with2Failures = {
    ...skill,
    automation: {
      ...skill.automation,
      consecutiveFailures: 2
    }
  };

  assert.equal(
    isUserSkillAutomationDue(with2Failures, new Date("2026-03-30T12:00:00.000Z")),
    true,
    "should still run with 2 failures"
  );
});

test("buildUserSkillRecord appends automation context into the rendered skill body", () => {
  const skill = createUserSkillDocument({
    title: "A2A Radar",
    description: "Track agent protocol shifts and refresh the playbook when specs move.",
    category: "a2a",
    body: "## Purpose\n\nWatch protocols.\n\n## Workflow\n\n1. Track updates.\n2. Capture deltas.\n3. Rewrite the skill.\n",
    tags: ["agents"],
    sourceUrls: ["https://openai.com/news/rss.xml"],
    autoUpdate: true,
    automationCadence: "weekly",
    automationPrompt: "Refresh protocol changes only."
  });

  const versioned = createNextUserSkillVersion(
    skill,
    {
      title: skill.title,
      description: skill.description,
      category: skill.category,
      body: skill.body,
      ownerName: skill.ownerName,
      tags: skill.tags,
      visibility: skill.visibility,
      sources: skill.sources,
      automation: {
        ...skill.automation,
        lastRunAt: "2026-03-27T12:00:00.000Z"
      },
      updates: [
        {
          generatedAt: "2026-03-27T12:00:00.000Z",
          summary: "Two protocol announcements landed this week.",
          whatChanged: "The watchlist shifted toward agent execution contracts.",
          experiments: ["Rewrite the handshake section.", "Add one provider delta."],
          items: [],
          bodyChanged: true,
          changedSections: ["Workflow", "Handshake"],
          editorModel: "gpt-5-mini"
        }
      ]
    },
    "2026-03-27T12:00:00.000Z"
  );

  const record = buildUserSkillRecord(versioned);

  assert.equal(record.origin, "user");
  assert.equal(record.href, "/skills/a2a-radar/v2");
  assert.equal(record.version, 2);
  assert.equal(record.versionLabel, "v2");
  assert.deepEqual(record.availableVersions.map((version) => version.label), ["v2", "v1"]);
  assert.equal(record.agents[0]?.provider, "loop");
  assert.match(record.body, /## Update engine/);
  assert.match(record.body, /Mode: fetch -> analyze -> rewrite -> version/);
  assert.match(record.body, /## Latest automated refresh/);
  assert.match(record.body, /Body edits: yes/);
  assert.match(record.body, /Editor: gpt-5-mini/);
  assert.match(record.body, /Sections changed: Workflow, Handshake/);
  assert.match(record.body, /Refresh log|Recent signal log/);
});

test("createNextUserSkillVersion increments the revision and preserves history", () => {
  const skill = createUserSkillDocument({
    title: "Infra Desk",
    description: "Track infra deltas and keep the operator notes current.",
    category: "infra",
    body: "## Purpose\n\nTrack infra deltas.\n\n## Workflow\n\n1. Scan source changes.\n2. Rewrite the notes.\n",
    tags: ["infra"],
    sourceUrls: ["https://vercel.com/blog/rss.xml"],
    autoUpdate: true,
    automationCadence: "daily",
    automationPrompt: "Refresh infra deltas."
  });

  const next = createNextUserSkillVersion(
    skill,
    {
      title: skill.title,
      description: skill.description,
      category: skill.category,
      body: skill.body,
      ownerName: skill.ownerName,
      tags: skill.tags,
      visibility: skill.visibility,
      sources: skill.sources,
      automation: {
        ...skill.automation,
        lastRunAt: "2026-03-28T12:00:00.000Z"
      },
      updates: [
        {
          generatedAt: "2026-03-28T12:00:00.000Z",
          summary: "Fresh infra notes landed.",
          whatChanged: "Vercel shipped another useful thing instead of another dashboard garnish.",
          experiments: ["Update deploy notes.", "Add rollback path."],
          items: []
        },
        ...skill.updates
      ]
    },
    "2026-03-28T12:00:00.000Z"
  );

  assert.equal(next.version, 2);
  assert.deepEqual(next.versions.map((version) => version.version), [2, 1]);
});

test("updateUserSkillDocument returns unchanged when setup matches current version", () => {
  const skill = createUserSkillDocument({
    title: "Frontend Desk",
    description: "Keep the frontend notes current.",
    category: "frontend",
    body: "## Goal\n\nStay current.\n\n## Workflow\n\n1. Read the sources.\n2. Capture only real deltas.\n3. Rewrite the notes.\n",
    ownerName: "Kevin",
    tags: ["frontend"],
    sourceUrls: ["https://react.dev/rss.xml"],
    autoUpdate: true,
    automationCadence: "daily",
    automationPrompt: "Track concrete frontend shifts."
  });

  const result = updateUserSkillDocument(skill, {
    slug: skill.slug,
    title: skill.title,
    description: skill.description,
    category: skill.category,
    body: skill.body,
    ownerName: skill.ownerName,
    tags: [],
    sourceUrls: skill.sources.map((source) => source.url),
    autoUpdate: true,
    automationCadence: "daily",
    automationPrompt: skill.automation.prompt
  });

  assert.equal(result.changed, false);
  assert.equal(result.skill.version, 1);
});

test("updateUserSkillDocument saves a new version with edited sources and automation", () => {
  const skill = createUserSkillDocument({
    title: "Protocol Watch",
    description: "Track agent protocol changes.",
    category: "a2a",
    body: "## Goal\n\nWatch protocol shifts.\n\n## Workflow\n\n1. Fetch source updates.\n2. Compare protocol changes.\n3. Rewrite the skill.\n",
    tags: ["tracked", "agents"],
    sourceUrls: ["https://openai.com/news/rss.xml"],
    autoUpdate: true,
    automationCadence: "daily",
    automationPrompt: "Track protocol deltas."
  });

  const result = updateUserSkillDocument(
    skill,
    {
      slug: skill.slug,
      title: "Protocol Watch",
      description: "Track protocol shifts and update the notes.",
      category: "a2a",
      body: "## Goal\n\nWatch protocol shifts.\n\n## Workflow\n\n1. Fetch.\n2. Rewrite.\n",
      tags: ["agents"],
      sourceUrls: ["https://openai.com/news/rss.xml", "https://modelcontextprotocol.io/"],
      autoUpdate: false,
      automationCadence: "manual",
      automationPrompt: "Only update the skill when the protocol actually changed."
    },
    new Date("2026-03-28T12:00:00.000Z")
  );

  assert.equal(result.changed, true);
  assert.equal(result.skill.version, 2);
  assert.equal(result.skill.description, "Track protocol shifts and update the notes.");
  assert.equal(result.skill.sources.length, 2);
  assert.equal(result.skill.automation.enabled, false);
  assert.equal(result.skill.automation.status, "paused");
  assert.ok(result.skill.tags.includes("tracked"));
  assert.deepEqual(result.skill.versions.map((version) => version.version), [2, 1]);
});
