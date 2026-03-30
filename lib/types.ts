export type CategorySlug =
  | "frontend"
  | "seo-geo"
  | "social"
  | "infra"
  | "containers"
  | "a2a"
  | "security"
  | "ops";

export type SourceKind = "rss" | "atom" | "docs" | "blog" | "github" | "watchlist";
export type SkillVisibility = "public" | "member";
export type CategoryStatus = "live" | "seeded";
export type SkillOrigin = "repo" | "codex" | "user" | "remote";
export type UserSkillCadence = "daily" | "weekly" | "manual";
export type UserSkillAutomationStatus = "active" | "paused";
export type AgentProviderKind = "gateway" | "openai" | "compatible";
export type ImportedMcpTransport = "stdio" | "http" | "sse" | "ws" | "unknown";
export type LoopUpdateTargetOrigin = "user" | "remote";

export type VersionReference = {
  version: number;
  label: string;
  updatedAt: string;
};

export type SourceDefinition = {
  id: string;
  label: string;
  url: string;
  kind: SourceKind;
  tags: string[];
  logoUrl?: string;
};

export type CategoryDefinition = {
  slug: CategorySlug;
  title: string;
  strapline: string;
  description: string;
  hero: string;
  accent: string;
  icon?: string;
  status: CategoryStatus;
  keywords: string[];
  sources: SourceDefinition[];
};

export type AgentDocKey = "codex" | "cursor" | "claude" | "agents";

export type AgentDocs = Partial<Record<AgentDocKey, string>> & Record<string, string | undefined>;

export const AGENT_DOC_FILENAMES: Record<AgentDocKey, string> = {
  codex: "codex.md",
  cursor: "cursor.md",
  claude: "claude.md",
  agents: "AGENTS.md"
};

export type SkillHeading = {
  depth: number;
  title: string;
  anchor: string;
};

export type ReferenceDoc = {
  slug: string;
  title: string;
  path: string;
  excerpt: string;
};

export type AgentPrompt = {
  provider: string;
  displayName: string;
  shortDescription: string;
  defaultPrompt: string;
  path: string;
};

export type AutomationSummary = {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  status: string;
  path: string;
  cwd: string[];
  matchedSkillSlugs: string[];
  matchedCategorySlugs: CategorySlug[];
};

export type SkillPrice = {
  amount: number;
  currency: string;
};

export type SkillRecord = {
  slug: string;
  title: string;
  description: string;
  category: CategorySlug;
  accent: string;
  featured: boolean;
  visibility: SkillVisibility;
  origin: SkillOrigin;
  href: string;
  path: string;
  relativeDir: string;
  updatedAt: string;
  tags: string[];
  headings: SkillHeading[];
  body: string;
  excerpt: string;
  references: ReferenceDoc[];
  agents: AgentPrompt[];
  automations: AutomationSummary[];
  version: number;
  versionLabel: string;
  availableVersions: VersionReference[];
  ownerName?: string;
  sources?: SourceDefinition[];
  automation?: SkillAutomationState;
  updates?: SkillUpdateEntry[];
  agentDocs?: AgentDocs;
  price?: SkillPrice | null;
  creatorClerkUserId?: string;
  iconUrl?: string;
};

export type DailySignal = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  tags: string[];
};

export type SkillAutomationState = {
  enabled: boolean;
  cadence: UserSkillCadence;
  status: UserSkillAutomationStatus;
  prompt: string;
  lastRunAt?: string;
  consecutiveFailures?: number;
};

export type SkillUpdateEntry = {
  generatedAt: string;
  summary: string;
  whatChanged: string;
  experiments: string[];
  items: DailySignal[];
  bodyChanged?: boolean;
  changedSections?: string[];
  editorModel?: string;
};

export type LoopUpdateTarget = {
  slug: string;
  title: string;
  category: CategorySlug;
  origin: LoopUpdateTargetOrigin;
  description: string;
  versionLabel: string;
  updatedAt: string;
  href: string;
  automationLabel: string;
  lastSummary?: string;
  lastWhatChanged?: string;
  lastGeneratedAt?: string;
  lastExperiments?: string[];
  lastSignals?: DailySignal[];
  lastChangedSections?: string[];
  lastBodyChanged?: boolean;
  lastEditorModel?: string;
  sources: Array<{
    id: string;
    label: string;
    url: string;
    kind: SourceKind;
    logoUrl: string;
  }>;
};

export type DiffLine = {
  type: "context" | "added" | "removed";
  value: string;
  leftNumber?: number;
  rightNumber?: number;
};

export type AgentReasoningStep = {
  index: number;
  reasoning: string;
  toolCall?: { name: string; args: Record<string, unknown> };
  toolResult?: string;
  diffLines?: DiffLine[];
  timestamp: string;
};

export type LoopUpdateSourceLog = {
  id: string;
  label: string;
  url: string;
  kind: SourceKind;
  logoUrl: string;
  status: "pending" | "running" | "done" | "error";
  itemCount: number;
  items: DailySignal[];
  note?: string;
};

export type LoopUpdateResult = {
  slug: string;
  title: string;
  origin: LoopUpdateTargetOrigin;
  changed: boolean;
  previousVersionLabel: string;
  nextVersionLabel: string;
  updatedAt: string;
  href: string;
  diffLines: DiffLine[];
  summary?: string;
  whatChanged?: string;
  experiments?: string[];
  items?: DailySignal[];
  changedSections?: string[];
  bodyChanged?: boolean;
  editorModel?: string;
  reasoningSteps?: AgentReasoningStep[];
};

export type LoopRunRecord = {
  id: string;
  slug: string;
  title: string;
  origin: LoopUpdateTargetOrigin;
  trigger: "manual" | "automation" | "import-sync";
  status: "success" | "error";
  startedAt: string;
  finishedAt: string;
  previousVersionLabel?: string;
  nextVersionLabel?: string;
  href?: string;
  summary?: string;
  whatChanged?: string;
  bodyChanged?: boolean;
  changedSections: string[];
  editorModel?: string;
  sourceCount: number;
  signalCount: number;
  messages: string[];
  sources: LoopUpdateSourceLog[];
  diffLines: DiffLine[];
  reasoningSteps?: AgentReasoningStep[];
  errorMessage?: string;
};

export type LoopUpdateStreamEvent =
  | {
      type: "start";
      loop: LoopUpdateTarget;
    }
  | {
      type: "source";
      source: LoopUpdateSourceLog;
    }
  | {
      type: "analysis";
      message: string;
    }
  | {
      type: "complete";
      result: LoopUpdateResult;
      sources: LoopUpdateSourceLog[];
    }
  | {
      type: "reasoning-step";
      step: AgentReasoningStep;
    }
  | {
      type: "error";
      message: string;
    };

export type UserSkillDocument = {
  slug: string;
  title: string;
  description: string;
  category: CategorySlug;
  body: string;
  ownerName?: string;
  tags: string[];
  visibility: SkillVisibility;
  createdAt: string;
  updatedAt: string;
  sources: SourceDefinition[];
  automation: SkillAutomationState;
  updates: SkillUpdateEntry[];
  version: number;
  versions: UserSkillVersion[];
  agentDocs?: AgentDocs;
  price?: SkillPrice | null;
  creatorClerkUserId?: string;
};

export type UserSkillStore = {
  version: 2;
  skills: UserSkillDocument[];
};

export type UserSkillVersion = {
  version: number;
  updatedAt: string;
  title: string;
  description: string;
  category: CategorySlug;
  body: string;
  ownerName?: string;
  tags: string[];
  visibility: SkillVisibility;
  sources: SourceDefinition[];
  automation: SkillAutomationState;
  updates: SkillUpdateEntry[];
  agentDocs?: AgentDocs;
  price?: SkillPrice | null;
};

export type ImportedSkillDocument = {
  slug: string;
  title: string;
  description: string;
  category: CategorySlug;
  body: string;
  sourceUrl: string;
  canonicalUrl: string;
  ownerName?: string;
  tags: string[];
  visibility: SkillVisibility;
  createdAt: string;
  updatedAt: string;
  syncEnabled: boolean;
  lastSyncedAt?: string;
  version: number;
  versions: ImportedSkillVersion[];
  agentDocs?: AgentDocs;
};

export type ImportedMcpDocument = {
  id: string;
  name: string;
  description: string;
  manifestUrl: string;
  homepageUrl?: string;
  transport: ImportedMcpTransport;
  url?: string;
  command?: string;
  args: string[];
  envKeys: string[];
  headers?: Record<string, string>;
  tags: string[];
  raw: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  versionLabel: string;
  versions: ImportedMcpVersion[];
  iconUrl?: string;
};

export type ImportedResourceStore = {
  version: 2;
  skills: ImportedSkillDocument[];
  mcps: ImportedMcpDocument[];
};

export type ImportedSkillVersion = {
  version: number;
  updatedAt: string;
  title: string;
  description: string;
  category: CategorySlug;
  body: string;
  sourceUrl: string;
  canonicalUrl: string;
  ownerName?: string;
  tags: string[];
  visibility: SkillVisibility;
  syncEnabled: boolean;
  lastSyncedAt?: string;
  agentDocs?: AgentDocs;
};

export type ImportedMcpVersion = {
  version: number;
  updatedAt: string;
  description: string;
  manifestUrl: string;
  homepageUrl?: string;
  transport: ImportedMcpTransport;
  url?: string;
  command?: string;
  args: string[];
  envKeys: string[];
  headers?: Record<string, string>;
  tags: string[];
  raw: string;
};

export type AgentProviderPreset = {
  id: string;
  label: string;
  kind: AgentProviderKind;
  baseURL?: string;
  apiKeyEnvVar?: string;
  docsUrl?: string;
  supportsModelListing?: boolean;
  defaultModel: string;
};

export type CategoryBrief = {
  slug: CategorySlug;
  title: string;
  summary: string;
  whatChanged: string;
  experiments: string[];
  items: DailySignal[];
  generatedAt: string;
};

export type MembershipPlan = {
  slug: string;
  title: string;
  priceLabel: string;
  interval: string;
  ctaLabel: string;
  description: string;
  features: string[];
};

export type SearchDocumentKind = "skill" | "category" | "brief" | "mcp";

export type SearchDocument = {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  description: string;
  href: string;
  category?: CategorySlug;
  tags: string[];
  updatedAt: string;
  origin?: SkillOrigin | "system";
  versionLabel?: string;
};

export type SearchHit = SearchDocument & {
  score: number;
};

export type SearchIndex = {
  version: 1;
  generatedAt: string;
  documents: SearchDocument[];
  tokens: Record<string, Array<{ id: string; score: number }>>;
};

export type RefreshRunRecord = {
  id: string;
  status: "success" | "error";
  startedAt: string;
  finishedAt: string;
  generatedAt?: string;
  generatedFrom?: "local-scan" | "remote-refresh";
  writeLocal: boolean;
  uploadBlob: boolean;
  refreshCategorySignals: boolean;
  refreshUserSkills: boolean;
  refreshImportedSkills: boolean;
  focusSkillSlugs: string[];
  focusImportedSkillSlugs: string[];
  skillCount?: number;
  categoryCount?: number;
  dailyBriefCount?: number;
  errorMessage?: string;
};

export type BillingEventRecord = {
  id: string;
  type: string;
  createdAt: string;
  livemode: boolean;
  customerId?: string;
  customerEmail?: string;
  subscriptionId?: string;
  planSlug?: string;
  status?: string;
  amount?: number;
  currency?: string;
};

export type StripeSubscriptionRecord = {
  id: string;
  customerId: string;
  clerkUserId?: string;
  customerEmail?: string;
  planSlug?: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
  checkoutCompletedAt?: string;
  updatedAt: string;
  latestInvoiceId?: string;
};

export type UsageEventKind =
  | "page_view"
  | "copy_prompt"
  | "copy_url"
  | "search"
  | "skill_create"
  | "skill_import"
  | "skill_track"
  | "skill_save"
  | "skill_refresh"
  | "automation_create"
  | "agent_run"
  | "api_call";

export type UsageEventSource = "ui" | "api";

export type UsageEventRecord = {
  id: string;
  at: string;
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

export type SystemStateStore = {
  version: 3;
  refreshRuns: RefreshRunRecord[];
  loopRuns: LoopRunRecord[];
  billingEvents: BillingEventRecord[];
  subscriptions: StripeSubscriptionRecord[];
  usageEvents: UsageEventRecord[];
};

export type LoopSnapshot = {
  generatedAt: string;
  generatedFrom: "local-scan" | "remote-refresh";
  categories: CategoryDefinition[];
  skills: SkillRecord[];
  mcps: ImportedMcpDocument[];
  automations: AutomationSummary[];
  dailyBriefs: CategoryBrief[];
  plans: MembershipPlan[];
  remoteSnapshotUrl?: string;
};

export type SkillPurchaseRecord = {
  id: string;
  clerkUserId: string;
  skillSlug: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  purchasedAt: string;
};

export type ConversationChannel = "copilot" | "agent-studio" | "sandbox";

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ConversationRecord = {
  id: string;
  clerkUserId: string;
  channel: ConversationChannel;
  title: string;
  messages: ConversationMessage[];
  model?: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
};
