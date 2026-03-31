/**
 * Validate all MCP seed definition URLs (manifestUrl, homepageUrl).
 * Reports broken links so they can be fixed.
 *
 * Usage: node --import tsx scripts/validate-mcp-urls.ts
 */

import { SEED_MCP_DEFINITIONS } from "@/lib/db/seed-data/mcp-definitions";

type CheckResult = {
  name: string;
  field: "manifestUrl" | "homepageUrl";
  url: string;
  status: number | "error";
  ok: boolean;
  redirect?: string;
};

async function checkUrl(url: string): Promise<{ status: number | "error"; ok: boolean; redirect?: string }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    const redirect = res.redirected ? res.url : undefined;
    return { status: res.status, ok: res.ok, redirect };
  } catch {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      const redirect = res.redirected ? res.url : undefined;
      return { status: res.status, ok: res.ok, redirect };
    } catch {
      return { status: "error", ok: false };
    }
  }
}

async function main() {
  console.log(`Validating URLs for ${SEED_MCP_DEFINITIONS.length} MCPs...\n`);

  const results: CheckResult[] = [];
  const CONCURRENCY = 8;
  const tasks: Array<() => Promise<void>> = [];

  for (const mcp of SEED_MCP_DEFINITIONS) {
    tasks.push(async () => {
      const manifest = await checkUrl(mcp.manifestUrl);
      results.push({
        name: mcp.name,
        field: "manifestUrl",
        url: mcp.manifestUrl,
        ...manifest,
      });
      if (mcp.homepageUrl) {
        const homepage = await checkUrl(mcp.homepageUrl);
        results.push({
          name: mcp.name,
          field: "homepageUrl",
          url: mcp.homepageUrl,
          ...homepage,
        });
      }
    });
  }

  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    await Promise.all(tasks.slice(i, i + CONCURRENCY).map((t) => t()));
  }

  const broken = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);

  console.log(`\n=== Results ===`);
  console.log(`  OK:     ${ok.length}`);
  console.log(`  Broken: ${broken.length}`);

  if (broken.length > 0) {
    console.log(`\n=== Broken URLs ===\n`);
    for (const r of broken) {
      console.log(`  [${r.status}] ${r.name} (${r.field}): ${r.url}`);
    }
  }

  const redirected = results.filter((r) => r.ok && r.redirect);
  if (redirected.length > 0) {
    console.log(`\n=== Redirected (may want to update) ===\n`);
    for (const r of redirected) {
      console.log(`  ${r.name} (${r.field}): ${r.url} -> ${r.redirect}`);
    }
  }
}

main().catch(console.error);
