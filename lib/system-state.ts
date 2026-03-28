import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type {
  BillingEventRecord,
  LoopRunRecord,
  RefreshRunRecord,
  StripeSubscriptionRecord,
  SystemStateStore,
  UsageEventRecord
} from "@/lib/types";

const SYSTEM_STATE_VERSION = 3;
const SYSTEM_STATE_FILE = path.join(process.cwd(), "content/generated/skillwire-system.local.json");
const SYSTEM_STATE_BLOB_PATH = "skillwire/system-state.json";

const refreshRunSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["success", "error"]),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime(),
  generatedAt: z.string().datetime().optional(),
  generatedFrom: z.enum(["local-scan", "remote-refresh"]).optional(),
  writeLocal: z.boolean(),
  uploadBlob: z.boolean(),
  refreshCategorySignals: z.boolean(),
  refreshUserSkills: z.boolean(),
  refreshImportedSkills: z.boolean(),
  focusSkillSlugs: z.array(z.string()),
  focusImportedSkillSlugs: z.array(z.string()),
  skillCount: z.number().int().min(0).optional(),
  categoryCount: z.number().int().min(0).optional(),
  dailyBriefCount: z.number().int().min(0).optional(),
  errorMessage: z.string().optional()
});

const billingEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  createdAt: z.string().datetime(),
  livemode: z.boolean(),
  customerId: z.string().optional(),
  customerEmail: z.string().optional(),
  subscriptionId: z.string().optional(),
  planSlug: z.string().optional(),
  status: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional()
});

const dailySignalSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  publishedAt: z.string().datetime(),
  summary: z.string(),
  tags: z.array(z.string())
});

const diffLineSchema = z.object({
  type: z.enum(["context", "added", "removed"]),
  value: z.string(),
  leftNumber: z.number().int().optional(),
  rightNumber: z.number().int().optional()
});

const loopSourceLogSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(["rss", "atom", "docs", "blog", "github", "watchlist"]),
  logoUrl: z.string(),
  status: z.enum(["pending", "running", "done", "error"]),
  itemCount: z.number().int().min(0),
  items: z.array(dailySignalSchema),
  note: z.string().optional()
});

const loopRunSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  origin: z.enum(["user", "remote"]),
  trigger: z.enum(["manual", "automation", "import-sync"]),
  status: z.enum(["success", "error"]),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime(),
  previousVersionLabel: z.string().optional(),
  nextVersionLabel: z.string().optional(),
  href: z.string().optional(),
  summary: z.string().optional(),
  whatChanged: z.string().optional(),
  bodyChanged: z.boolean().optional(),
  changedSections: z.array(z.string()),
  editorModel: z.string().optional(),
  sourceCount: z.number().int().min(0),
  signalCount: z.number().int().min(0),
  messages: z.array(z.string()),
  sources: z.array(loopSourceLogSchema),
  diffLines: z.array(diffLineSchema),
  errorMessage: z.string().optional()
});

const subscriptionSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  customerEmail: z.string().optional(),
  planSlug: z.string().optional(),
  status: z.string().min(1),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: z.string().datetime().optional(),
  checkoutCompletedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
  latestInvoiceId: z.string().optional()
});

const usageEventSchema = z.object({
  id: z.string().min(1),
  at: z.string().datetime(),
  kind: z.enum([
    "page_view",
    "copy_prompt",
    "copy_url",
    "search",
    "skill_create",
    "skill_import",
    "skill_track",
    "skill_save",
    "skill_refresh",
    "automation_create",
    "agent_run",
    "api_call"
  ]),
  source: z.enum(["ui", "api"]),
  label: z.string().min(1),
  path: z.string().optional(),
  route: z.string().optional(),
  method: z.string().optional(),
  status: z.number().int().optional(),
  durationMs: z.number().int().min(0).optional(),
  ok: z.boolean().optional(),
  skillSlug: z.string().optional(),
  categorySlug: z.enum(["frontend", "seo-geo", "social", "infra", "containers", "a2a", "security", "ops"]).optional(),
  details: z.string().optional()
});

function emptyStore(): SystemStateStore {
  return {
    version: SYSTEM_STATE_VERSION,
    refreshRuns: [],
    loopRuns: [],
    billingEvents: [],
    subscriptions: [],
    usageEvents: []
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeStore(value: unknown): SystemStateStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyStore();
  }

  const input = value as Partial<SystemStateStore>;
  const refreshRuns = Array.isArray(input.refreshRuns)
    ? input.refreshRuns
        .map((entry) => refreshRunSchema.safeParse(entry))
        .filter((entry) => entry.success)
        .map((entry) => entry.data)
    : [];
  const billingEvents = Array.isArray(input.billingEvents)
    ? input.billingEvents
        .map((entry) => billingEventSchema.safeParse(entry))
        .filter((entry) => entry.success)
        .map((entry) => entry.data)
    : [];
  const loopRuns = Array.isArray(input.loopRuns)
    ? input.loopRuns
        .map((entry) => loopRunSchema.safeParse(entry))
        .filter((entry) => entry.success)
        .map((entry) => entry.data)
    : [];
  const subscriptions = Array.isArray(input.subscriptions)
    ? input.subscriptions
        .map((entry) => subscriptionSchema.safeParse(entry))
        .filter((entry) => entry.success)
        .map((entry) => entry.data)
    : [];
  const usageEvents = Array.isArray(input.usageEvents)
    ? input.usageEvents
        .map((entry) => usageEventSchema.safeParse(entry))
        .filter((entry) => entry.success)
        .map((entry) => entry.data)
    : [];

  return {
    version: SYSTEM_STATE_VERSION,
    refreshRuns,
    loopRuns,
    billingEvents,
    subscriptions,
    usageEvents
  };
}

async function readStoreFromBlob(): Promise<SystemStateStore | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { list } = await import("@vercel/blob");
    const result = await list({
      limit: 10,
      prefix: SYSTEM_STATE_BLOB_PATH
    });
    const blob = result.blobs.find((entry) => entry.pathname === SYSTEM_STATE_BLOB_PATH);
    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return normalizeStore(await response.json());
  } catch {
    return null;
  }
}

async function readStoreFromFile(): Promise<SystemStateStore | null> {
  if (!(await pathExists(SYSTEM_STATE_FILE))) {
    return null;
  }

  try {
    return normalizeStore(JSON.parse(await fs.readFile(SYSTEM_STATE_FILE, "utf8")));
  } catch {
    return null;
  }
}

export async function readSystemStateStore(): Promise<SystemStateStore> {
  const remote = await readStoreFromBlob();
  if (remote) {
    return remote;
  }

  return (await readStoreFromFile()) ?? emptyStore();
}

export async function writeSystemStateStore(store: SystemStateStore): Promise<void> {
  const normalized = normalizeStore(store);
  const payload = JSON.stringify(normalized, null, 2);

  await fs.mkdir(path.dirname(SYSTEM_STATE_FILE), { recursive: true });
  await fs.writeFile(SYSTEM_STATE_FILE, payload);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(SYSTEM_STATE_BLOB_PATH, payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
  }
}

export async function recordRefreshRun(entry: RefreshRunRecord): Promise<void> {
  const store = await readSystemStateStore();
  await writeSystemStateStore({
    ...store,
    refreshRuns: [entry, ...store.refreshRuns.filter((run) => run.id !== entry.id)].slice(0, 40)
  });
}

export async function recordLoopRun(entry: LoopRunRecord): Promise<void> {
  const store = await readSystemStateStore();
  await writeSystemStateStore({
    ...store,
    loopRuns: [entry, ...store.loopRuns.filter((run) => run.id !== entry.id)].slice(0, 120)
  });
}

export async function recordBillingEvent(entry: BillingEventRecord): Promise<void> {
  const store = await readSystemStateStore();
  await writeSystemStateStore({
    ...store,
    billingEvents: [entry, ...store.billingEvents.filter((event) => event.id !== entry.id)].slice(0, 100)
  });
}

export async function upsertSubscription(entry: StripeSubscriptionRecord): Promise<void> {
  const store = await readSystemStateStore();
  await writeSystemStateStore({
    ...store,
    subscriptions: [entry, ...store.subscriptions.filter((subscription) => subscription.id !== entry.id)].slice(0, 100)
  });
}

export async function recordUsageEvent(entry: UsageEventRecord): Promise<void> {
  const store = await readSystemStateStore();
  await writeSystemStateStore({
    ...store,
    usageEvents: [entry, ...store.usageEvents.filter((event) => event.id !== entry.id)].slice(0, 5000)
  });
}
