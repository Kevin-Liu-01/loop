import {
  recordLoopRun as dbRecordLoopRun,
  listLoopRuns as dbListLoopRuns,
  recordRefreshRun as dbRecordRefreshRun,
  listRefreshRuns as dbListRefreshRuns,
  recordUsageEvent as dbRecordUsageEvent,
  listUsageEvents as dbListUsageEvents,
  recordBillingEvent as dbRecordBillingEvent,
  upsertSubscription as dbUpsertSubscription,
  listSubscriptions as dbListSubscriptions
} from "@/lib/db/system-state";
import type {
  BillingEventRecord,
  LoopRunRecord,
  RefreshRunRecord,
  StripeSubscriptionRecord,
  UsageEventRecord
} from "@/lib/types";

export async function recordRefreshRun(entry: RefreshRunRecord): Promise<void> {
  await dbRecordRefreshRun(entry);
}

export async function recordLoopRun(entry: LoopRunRecord): Promise<void> {
  await dbRecordLoopRun(entry);
}

export async function recordBillingEvent(entry: BillingEventRecord): Promise<void> {
  await dbRecordBillingEvent(entry);
}

export async function upsertSubscription(entry: StripeSubscriptionRecord): Promise<void> {
  await dbUpsertSubscription(entry);
}

export async function recordUsageEvent(entry: UsageEventRecord): Promise<void> {
  await dbRecordUsageEvent(entry);
}

export async function listLoopRuns(options?: {
  skillSlug?: string;
  limit?: number;
}): Promise<LoopRunRecord[]> {
  return dbListLoopRuns(options);
}

export async function listRefreshRuns(limit?: number): Promise<RefreshRunRecord[]> {
  return dbListRefreshRuns(limit);
}

export async function listUsageEvents(limit?: number): Promise<UsageEventRecord[]> {
  return dbListUsageEvents(limit);
}

export async function listSubscriptions(): Promise<StripeSubscriptionRecord[]> {
  return dbListSubscriptions();
}
