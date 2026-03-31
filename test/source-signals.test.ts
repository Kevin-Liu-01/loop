import assert from "node:assert/strict";
import test from "node:test";

import { SKILL_SOURCE_CONFIGS } from "@/lib/db/seed-data/skill-sources";
import { normalizeFeedItems } from "@/lib/source-signals";
import type { SourceDefinition } from "@/lib/types";

const stubSource: SourceDefinition = {
  id: "test-source",
  label: "Test Source",
  url: "https://example.com/feed.xml",
  kind: "rss",
  tags: ["test"],
};

test("normalizeFeedItems parses a valid RSS 2.0 feed", () => {
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>First Article</title>
      <link>https://example.com/1</link>
      <description>Summary of first article.</description>
      <pubDate>Sat, 28 Mar 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second Article</title>
      <link>https://example.com/2</link>
      <description>Summary of second article.</description>
      <pubDate>Fri, 27 Mar 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  const items = normalizeFeedItems(stubSource, rss);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "First Article");
  assert.equal(items[0].url, "https://example.com/1");
  assert.equal(items[0].source, "Test Source");
  assert.ok(items[0].summary.includes("Summary of first"));
});

test("normalizeFeedItems parses a valid Atom feed", () => {
  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <entry>
    <title>Atom Entry One</title>
    <link href="https://example.com/atom/1" />
    <summary>Atom summary one.</summary>
    <updated>2026-03-28T10:00:00Z</updated>
  </entry>
</feed>`;

  const items = normalizeFeedItems(stubSource, atom);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Atom Entry One");
  assert.equal(items[0].url, "https://example.com/atom/1");
});

test("normalizeFeedItems falls back to HTML link extraction for HTML pages", () => {
  const html = `<!DOCTYPE html>
<html>
<head><title>Docs page</title></head>
<body>
  <a href="https://example.com/docs/guide">Getting Started Guide</a>
  <a href="https://example.com/docs/api">API Reference</a>
  <a href="#">Skip link</a>
  <a href="mailto:test@test.com">Email</a>
</body>
</html>`;

  const items = normalizeFeedItems(stubSource, html);
  assert.ok(items.length >= 2, `Expected at least 2 items, got ${items.length}`);
  assert.ok(items.some((item) => item.title === "Getting Started Guide"));
  assert.ok(items.some((item) => item.title === "API Reference"));
  assert.ok(!items.some((item) => item.url.startsWith("#")));
  assert.ok(!items.some((item) => item.url.startsWith("mailto:")));
});

test("normalizeFeedItems falls back to link extraction when XML parse yields zero items", () => {
  const mixedContent = `<div>
    <a href="https://example.com/article/1">Interesting Article</a>
    <a href="https://example.com/article/2">Another Good Read</a>
  </div>`;

  const items = normalizeFeedItems(stubSource, mixedContent);
  assert.ok(items.length >= 2);
  assert.ok(items.some((item) => item.title === "Interesting Article"));
});

test("normalizeFeedItems returns empty for very short or empty payloads", () => {
  assert.deepEqual(normalizeFeedItems(stubSource, ""), []);
  assert.deepEqual(normalizeFeedItems(stubSource, "hi"), []);
});

test("normalizeFeedItems caps at MAX_FEED_ITEMS", () => {
  const entries = Array.from({ length: 20 }, (_, index) =>
    `<item>
      <title>Article ${index + 1}</title>
      <link>https://example.com/${index + 1}</link>
      <pubDate>Sat, ${String(28 - index).padStart(2, "0")} Mar 2026 10:00:00 GMT</pubDate>
    </item>`
  ).join("\n");

  const rss = `<?xml version="1.0"?><rss version="2.0"><channel>${entries}</channel></rss>`;
  const items = normalizeFeedItems(stubSource, rss);
  assert.ok(items.length <= 12);
});

test("normalizeFeedItems resolves Atom link with href attribute", () => {
  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <entry>
    <id>https://example.com/blog/post-1</id>
    <title>Post from Atom</title>
    <link href="https://example.com/blog/post-1" rel="alternate" />
    <link href="https://example.com/blog/post-1.atom" rel="self" />
    <summary>An Atom entry with multiple links.</summary>
    <updated>2026-03-28T10:00:00Z</updated>
  </entry>
</feed>`;

  const items = normalizeFeedItems(stubSource, atom);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://example.com/blog/post-1");
  assert.equal(items[0].title, "Post from Atom");
});

test("normalizeFeedItems handles single Atom link object without array", () => {
  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Single Link Feed</title>
  <entry>
    <id>https://example.com/single</id>
    <title>Single Link Entry</title>
    <link href="https://example.com/single" />
    <summary>Only one link tag.</summary>
    <updated>2026-03-28T10:00:00Z</updated>
  </entry>
</feed>`;

  const items = normalizeFeedItems(stubSource, atom);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://example.com/single");
});

test("normalizeFeedItems strips HTML from title and summary", () => {
  const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[<b>Bold</b> Title]]></title>
      <link>https://example.com/bold</link>
      <description><![CDATA[<p>Paragraph with <em>emphasis</em> and more.</p>]]></description>
      <pubDate>Sat, 28 Mar 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  const items = normalizeFeedItems(stubSource, rss);
  assert.equal(items.length, 1);
  assert.ok(!items[0].title.includes("<b>"), "Title should not contain HTML tags");
  assert.ok(!items[0].summary.includes("<p>"), "Summary should not contain HTML tags");
});

test("all seeded sources expose discovery metadata", () => {
  const missing = SKILL_SOURCE_CONFIGS.flatMap((config) =>
    config.sources
      .filter(
        (source) =>
          !source.mode ||
          !source.trust ||
          !source.parser ||
          !source.searchQueries ||
          source.searchQueries.length === 0,
      )
      .map((source) => `${config.slug}:${source.id}`),
  );

  assert.deepEqual(missing, []);
});

test("normalizeFeedItems ranks sitemap links against query hints", () => {
  const source: SourceDefinition = {
    id: "anthropic-docs",
    label: "Anthropic Docs Index",
    url: "https://docs.anthropic.com/en/sitemap.xml",
    kind: "sitemap",
    tags: ["anthropic", "claude", "api"],
    mode: "discover",
    trust: "official",
    parser: "sitemap",
    searchQueries: ["tool use", "mcp", "json schema"],
  };

  const payload = `
    <urlset>
      <url>
        <loc>https://docs.anthropic.com/en/docs/build-with-claude/tool-use</loc>
        <lastmod>2026-03-30T10:00:00.000Z</lastmod>
      </url>
      <url>
        <loc>https://docs.anthropic.com/en/docs/resources/mcp</loc>
        <lastmod>2026-03-29T10:00:00.000Z</lastmod>
      </url>
      <url>
        <loc>https://docs.anthropic.com/en/docs/resources/account-management</loc>
        <lastmod>2026-03-31T10:00:00.000Z</lastmod>
      </url>
    </urlset>
  `;

  const items = normalizeFeedItems(source, payload);

  assert.equal(items[0]?.url, "https://docs.anthropic.com/en/docs/build-with-claude/tool-use");
  assert.match(items[1]?.url ?? "", /mcp/);
});
