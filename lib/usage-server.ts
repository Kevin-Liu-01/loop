import { randomUUID } from "node:crypto";

import { recordUsageEvent } from "@/lib/system-state";
import type { CategorySlug, UsageEventKind, UsageEventRecord, UsageEventSource } from "@/lib/types";

type UsageEventInput = {
  at?: string;
  kind: UsageEventKind;
  source: UsageEventSource;
  label: string;
  path?: string;
  route?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  ok?: boolean;
  skillSlug?: string;
  categorySlug?: CategorySlug;
  details?: string;
};

type ApiUsageContext = {
  route: string;
  method: string;
  label?: string;
  skillSlug?: string;
  categorySlug?: CategorySlug;
  details?: string;
};

export async function logUsageEvent(input: UsageEventInput): Promise<void> {
  try {
    const entry: UsageEventRecord = {
      id: randomUUID(),
      at: input.at ?? new Date().toISOString(),
      kind: input.kind,
      source: input.source,
      label: input.label,
      path: input.path,
      route: input.route,
      method: input.method,
      status: input.status,
      durationMs: input.durationMs,
      ok: input.ok,
      skillSlug: input.skillSlug,
      categorySlug: input.categorySlug,
      details: input.details
    };

    await recordUsageEvent(entry);
  } catch (error) {
    console.error("[usage] Failed to record usage event:", error);
  }
}

export async function withApiUsage(
  context: ApiUsageContext,
  handler: () => Promise<Response>
): Promise<Response> {
  const startedAt = Date.now();

  try {
    const response = await handler();
    await logUsageEvent({
      kind: "api_call",
      source: "api",
      label: context.label ?? context.route,
      route: context.route,
      method: context.method,
      status: response.status,
      durationMs: Date.now() - startedAt,
      ok: response.ok,
      skillSlug: context.skillSlug,
      categorySlug: context.categorySlug,
      details: context.details
    });
    return response;
  } catch (error) {
    await logUsageEvent({
      kind: "api_call",
      source: "api",
      label: context.label ?? context.route,
      route: context.route,
      method: context.method,
      status: 500,
      durationMs: Date.now() - startedAt,
      ok: false,
      skillSlug: context.skillSlug,
      categorySlug: context.categorySlug,
      details: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}
