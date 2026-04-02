import { getServerSupabase } from "@/lib/db/client";
import type {
  BillingEventRecord,
  LoopRunRecord,
  RefreshRunRecord,
  StripeSubscriptionRecord,
  UsageEventRecord
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Loop runs
// ---------------------------------------------------------------------------

export async function recordLoopRun(entry: LoopRunRecord): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("loop_runs").upsert(
    {
      id: entry.id,
      skill_slug: entry.slug,
      title: entry.title,
      origin: entry.origin,
      trigger: entry.trigger,
      status: entry.status,
      started_at: entry.startedAt,
      finished_at: entry.finishedAt,
      previous_version_label: entry.previousVersionLabel ?? null,
      next_version_label: entry.nextVersionLabel ?? null,
      href: entry.href ?? null,
      summary: entry.summary ?? null,
      what_changed: entry.whatChanged ?? null,
      body_changed: entry.bodyChanged ?? null,
      changed_sections: entry.changedSections,
      editor_model: entry.editorModel ?? null,
      source_count: entry.sourceCount,
      signal_count: entry.signalCount,
      messages: entry.messages,
      sources: entry.sources,
      diff_lines: entry.diffLines,
      reasoning_steps: entry.reasoningSteps ?? null,
      error_message: entry.errorMessage ?? null,
      searches_used: entry.searchesUsed ?? null,
      added_sources: entry.addedSources ?? null
    } as never,
    { onConflict: "id" }
  );

  if (error) throw new Error(`recordLoopRun failed: ${error.message}`);
}

export async function listLoopRuns(options?: {
  skillSlug?: string;
  limit?: number;
}): Promise<LoopRunRecord[]> {
  const db = getServerSupabase();
  let query = db.from("loop_runs").select("*").order("started_at", { ascending: false });

  if (options?.skillSlug) {
    query = query.eq("skill_slug", options.skillSlug);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`listLoopRuns failed: ${error.message}`);

  return (data ?? []).map((row) => {
    const r = row as typeof row & { searches_used?: number | null; added_sources?: unknown };
    return {
      id: r.id,
      slug: r.skill_slug,
      title: r.title,
      origin: r.origin as LoopRunRecord["origin"],
      trigger: r.trigger as LoopRunRecord["trigger"],
      status: r.status as LoopRunRecord["status"],
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      previousVersionLabel: r.previous_version_label ?? undefined,
      nextVersionLabel: r.next_version_label ?? undefined,
      href: r.href ?? undefined,
      summary: r.summary ?? undefined,
      whatChanged: r.what_changed ?? undefined,
      bodyChanged: r.body_changed ?? undefined,
      changedSections: r.changed_sections,
      editorModel: r.editor_model ?? undefined,
      sourceCount: r.source_count,
      signalCount: r.signal_count,
      messages: r.messages,
      sources: r.sources as LoopRunRecord["sources"],
      diffLines: r.diff_lines as LoopRunRecord["diffLines"],
      reasoningSteps: (r.reasoning_steps ?? undefined) as LoopRunRecord["reasoningSteps"],
      errorMessage: r.error_message ?? undefined,
      searchesUsed: r.searches_used ?? undefined,
      addedSources: (r.added_sources ?? undefined) as LoopRunRecord["addedSources"]
    };
  });
}

// ---------------------------------------------------------------------------
// Refresh runs
// ---------------------------------------------------------------------------

export async function recordRefreshRun(entry: RefreshRunRecord): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("refresh_runs").upsert(
    {
      id: entry.id,
      status: entry.status,
      started_at: entry.startedAt,
      finished_at: entry.finishedAt,
      generated_at: entry.generatedAt ?? null,
      generated_from: entry.generatedFrom ?? null,
      write_local: entry.writeLocal,
      upload_blob: entry.uploadBlob,
      refresh_category_signals: entry.refreshCategorySignals,
      refresh_user_skills: entry.refreshUserSkills,
      refresh_imported_skills: entry.refreshImportedSkills,
      focus_skill_slugs: entry.focusSkillSlugs,
      focus_imported_skill_slugs: entry.focusImportedSkillSlugs,
      skill_count: entry.skillCount ?? null,
      category_count: entry.categoryCount ?? null,
      daily_brief_count: entry.dailyBriefCount ?? null,
      error_message: entry.errorMessage ?? null
    } as never,
    { onConflict: "id" }
  );

  if (error) throw new Error(`recordRefreshRun failed: ${error.message}`);
}

export async function listRefreshRuns(limit = 40): Promise<RefreshRunRecord[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("refresh_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listRefreshRuns failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status as RefreshRunRecord["status"],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    generatedAt: row.generated_at ?? undefined,
    generatedFrom: (row.generated_from ?? undefined) as RefreshRunRecord["generatedFrom"],
    writeLocal: row.write_local,
    uploadBlob: row.upload_blob,
    refreshCategorySignals: row.refresh_category_signals,
    refreshUserSkills: row.refresh_user_skills,
    refreshImportedSkills: row.refresh_imported_skills,
    focusSkillSlugs: row.focus_skill_slugs,
    focusImportedSkillSlugs: row.focus_imported_skill_slugs,
    skillCount: row.skill_count ?? undefined,
    categoryCount: row.category_count ?? undefined,
    dailyBriefCount: row.daily_brief_count ?? undefined,
    errorMessage: row.error_message ?? undefined
  }));
}

// ---------------------------------------------------------------------------
// Usage events
// ---------------------------------------------------------------------------

export async function recordUsageEvent(entry: UsageEventRecord): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("usage_events").insert({
    id: entry.id,
    at: entry.at,
    kind: entry.kind,
    source: entry.source,
    label: entry.label,
    path: entry.path ?? null,
    route: entry.route ?? null,
    method: entry.method ?? null,
    status: entry.status ?? null,
    duration_ms: entry.durationMs ?? null,
    ok: entry.ok ?? null,
    skill_slug: entry.skillSlug ?? null,
    category_slug: entry.categorySlug ?? null,
    details: entry.details ?? null
  } as never);

  if (error) throw new Error(`recordUsageEvent failed: ${error.message}`);
}

function mapUsageEventRow(row: Record<string, unknown>): UsageEventRecord {
  return {
    id: row.id as string,
    at: row.at as string,
    kind: row.kind as UsageEventRecord["kind"],
    source: row.source as UsageEventRecord["source"],
    label: row.label as string,
    path: (row.path ?? undefined) as string | undefined,
    route: (row.route ?? undefined) as string | undefined,
    method: (row.method ?? undefined) as string | undefined,
    status: (row.status ?? undefined) as number | undefined,
    durationMs: (row.duration_ms ?? undefined) as number | undefined,
    ok: (row.ok ?? undefined) as boolean | undefined,
    skillSlug: (row.skill_slug ?? undefined) as string | undefined,
    categorySlug: (row.category_slug ?? undefined) as UsageEventRecord["categorySlug"],
    details: (row.details ?? undefined) as string | undefined
  };
}

export async function listUsageEvents(limit = 100): Promise<UsageEventRecord[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("usage_events")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listUsageEvents failed: ${error.message}`);

  return (data ?? []).map((row) => mapUsageEventRow(row as Record<string, unknown>));
}

/** Events with `at >= sinceIso`, newest first (for calendar-bounded overview windows). */
export async function listUsageEventsSince(
  sinceIso: string,
  limit: number
): Promise<UsageEventRecord[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("usage_events")
    .select("*")
    .gte("at", sinceIso)
    .order("at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listUsageEventsSince failed: ${error.message}`);

  return (data ?? []).map((row) => mapUsageEventRow(row as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Billing events
// ---------------------------------------------------------------------------

export async function recordBillingEvent(entry: BillingEventRecord): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("billing_events").upsert(
    {
      id: entry.id,
      type: entry.type,
      created_at: entry.createdAt,
      livemode: entry.livemode,
      customer_id: entry.customerId ?? null,
      customer_email: entry.customerEmail ?? null,
      subscription_id: entry.subscriptionId ?? null,
      plan_slug: entry.planSlug ?? null,
      status: entry.status ?? null,
      amount: entry.amount ?? null,
      currency: entry.currency ?? null
    } as never,
    { onConflict: "id" }
  );

  if (error) throw new Error(`recordBillingEvent failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export async function upsertSubscription(entry: StripeSubscriptionRecord): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("subscriptions").upsert(
    {
      id: entry.id,
      customer_id: entry.customerId,
      clerk_user_id: entry.clerkUserId ?? null,
      customer_email: entry.customerEmail ?? null,
      plan_slug: entry.planSlug ?? null,
      status: entry.status,
      cancel_at_period_end: entry.cancelAtPeriodEnd,
      current_period_end: entry.currentPeriodEnd ?? null,
      checkout_completed_at: entry.checkoutCompletedAt ?? null,
      updated_at: entry.updatedAt,
      latest_invoice_id: entry.latestInvoiceId ?? null
    } as never,
    { onConflict: "id" }
  );

  if (error) throw new Error(`upsertSubscription failed: ${error.message}`);
}

export async function listSubscriptions(): Promise<StripeSubscriptionRecord[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("subscriptions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`listSubscriptions failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    clerkUserId: row.clerk_user_id ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    planSlug: row.plan_slug ?? undefined,
    status: row.status,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    currentPeriodEnd: row.current_period_end ?? undefined,
    checkoutCompletedAt: row.checkout_completed_at ?? undefined,
    updatedAt: row.updated_at,
    latestInvoiceId: row.latest_invoice_id ?? undefined
  }));
}
