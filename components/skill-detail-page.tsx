import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AppGridShell } from "@/components/app-grid-shell";
import { BuySkillButton } from "@/components/buy-skill-button";
import { CopyButton } from "@/components/copy-button";
import { ExpandableContent } from "@/components/expandable-content";
import { FlowIcon, PlayIcon } from "@/components/frontier-icons";
import { ShareButton } from "@/components/share-button";
import { SkillHeaderShaderEmbed } from "@/components/skill-header-shader-embed";
import { SiteHeader } from "@/components/site-header";
import { SkillDetailSidebar } from "@/components/skill-detail-sidebar";
import { SkillSetupForm } from "@/components/skill-setup-form";
import { SkillUpdateRunner } from "@/components/skill-update-runner";
import { TrackSkillButton } from "@/components/track-skill-button";
import { UsageBeacon } from "@/components/usage-beacon";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { SimpleList, SimpleListBody, SimpleListItem } from "@/components/ui/simple-list";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { inlineSectionLabel, pageInsetPadX } from "@/lib/ui-layout";
import { diffMultilineText } from "@/lib/text-diff";
import { buildUpdateDigest } from "@/lib/update-digest";
import { SkillIcon } from "@/components/ui/skill-icon";
import type { SkillUsageSummary } from "@/lib/usage";
import type { AutomationSummary, CategoryBrief, LoopRunRecord, SkillRecord } from "@/lib/types";

const sectionH2 = "m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink";
const promptSurface =
  "rounded-none border border-line bg-paper-2/50 p-4 dark:bg-paper-2/25";
const sectionTitle = "m-0 text-lg font-semibold tracking-tight text-ink";

type SkillDetailPageProps = {
  skill: SkillRecord;
  brief?: CategoryBrief;
  previousSkill?: SkillRecord | null;
  latestRun?: LoopRunRecord | null;
  usage: SkillUsageSummary;
  purchased?: boolean;
};

function buildAttachedAutomations(skill: SkillRecord): AutomationSummary[] {
  const builtIn: AutomationSummary[] =
    skill.origin === "user" && skill.automation
      ? [
          {
            id: `built-in:${skill.slug}`,
            name: skill.automation.enabled ? `${skill.title} refresh` : "Manual refresh",
            prompt: skill.automation.prompt,
            schedule: skill.automation.enabled
              ? `${skill.automation.cadence} ${skill.automation.status}`
              : "manual",
            status: skill.automation.status === "paused" ? "PAUSED" : "ACTIVE",
            path: "",
            cwd: [],
            matchedSkillSlugs: [skill.slug],
            matchedCategorySlugs: []
          }
        ]
      : [];

  return [...builtIn, ...skill.automations];
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

export function SkillDetailPage({
  skill,
  brief,
  previousSkill,
  latestRun,
  usage,
  purchased = false
}: SkillDetailPageProps) {
  const isPaid = skill.price && skill.price.amount > 0;
  const priceLabel = isPaid ? formatPrice(skill.price!.amount, skill.price!.currency) : null;
  const primaryAgentPrompt =
    skill.agents[0]?.defaultPrompt ?? `Use $${skill.slug} for this task.`;
  const trackedSources =
    skill.origin === "user" ? skill.sources ?? [] : skill.references;
  const attachedAutomations = buildAttachedAutomations(skill);
  const latestUpdate = skill.updates?.[0];
  const isUpdateable = skill.origin === "user" || skill.origin === "remote";
  const sourceCount =
    skill.origin === "user"
      ? (skill.sources ?? []).length
      : skill.origin === "remote"
        ? (skill.sources ?? skill.references).length
        : 0;
  const visibleChangedSections =
    latestUpdate?.changedSections ?? latestRun?.changedSections ?? [];

  const updateDigestDiff =
    latestUpdate || previousSkill?.updates?.[0]
      ? diffMultilineText(
          buildUpdateDigest(previousSkill?.updates?.[0]),
          buildUpdateDigest(latestUpdate)
        )
      : [];
  const rawDiff =
    updateDigestDiff.length > 0
      ? updateDigestDiff
      : previousSkill
        ? diffMultilineText(previousSkill.body, skill.body)
        : [];
  const diffLines = rawDiff.length > 80 ? rawDiff.slice(0, 80) : rawDiff;

  return (
    <AppGridShell header={<SiteHeader />}>
      <UsageBeacon
        categorySlug={skill.category}
        dedupeKey={`page:${skill.href}`}
        kind="page_view"
        label="Opened skill detail"
        path={skill.href}
        skillSlug={skill.slug}
      />
      <PageShell inset className="flex min-h-0 flex-1 flex-col">
        <div className={cn("relative shrink-0 overflow-hidden border-b border-line py-4", pageInsetPadX)}>
          <SkillHeaderShaderEmbed />
          <header className="relative z-10 grid gap-4">
            <Link
              className="w-fit text-xs font-medium text-ink-faint transition-colors hover:text-ink"
              href="/"
            >
              &larr; Back to skills
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Badge>{skill.category}</Badge>
              <Badge muted>{skill.origin}</Badge>
              <Badge muted>{skill.versionLabel}</Badge>
              {priceLabel ? <Badge>{priceLabel}</Badge> : <Badge muted>Free</Badge>}
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <SkillIcon className="rounded-lg" iconUrl={skill.iconUrl} size={36} slug={skill.slug} />
              <h1 className="m-0 font-serif text-2xl font-medium tracking-[-0.03em] text-ink wrap-break-word">
                {skill.title}
              </h1>
              <ShareButton href={skill.href} />
            </div>
            <p className="m-0 max-w-[min(100%,52ch)] text-pretty text-sm leading-relaxed text-ink-muted wrap-break-word">
              {skill.description}
            </p>
            <p className="m-0 text-xs leading-normal text-ink-soft tabular-nums">
              {trackedSources.length} sources · Updated {formatRelativeDate(skill.updatedAt)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {isPaid && priceLabel ? (
                <BuySkillButton
                  priceLabel={priceLabel}
                  purchased={purchased}
                  slug={skill.slug}
                />
              ) : null}
              <LinkButton
                href={`/sandbox?skill=${skill.slug}`}
                size="sm"
                variant="primary"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Run in sandbox
              </LinkButton>
              {skill.origin !== "user" ? (
                <TrackSkillButton
                  label="Track skill"
                  redirectTo="detail"
                  size="sm"
                  slug={skill.slug}
                  variant="soft"
                />
              ) : null}
              <CopyButton
                className="text-xs"
                iconSize="sm"
                label="Copy prompt"
                size="sm"
                usageEvent={{
                  kind: "copy_prompt",
                  label: "Copied prompt",
                  path: skill.href,
                  skillSlug: skill.slug,
                  categorySlug: skill.category
                }}
                value={primaryAgentPrompt}
                variant="soft"
              />
              <CopyButton
                className="text-xs"
                iconSize="sm"
                label="Copy link"
                size="sm"
                usageEvent={{
                  kind: "copy_url",
                  label: "Copied skill link",
                  path: skill.href,
                  skillSlug: skill.slug,
                  categorySlug: skill.category
                }}
                value={skill.href}
                variant="soft"
              />
            </div>
          </header>
        </div>

        {/* ── Two-column layout: Main + Sidebar (full height rule) ── */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto border-line py-5 pb-16 sm:py-6 lg:border-r",
              pageInsetPadX
            )}
          >
            <div className="grid gap-8">
            {/* Content */}
            <section id="content" className="grid gap-5">
              <h2 className={sectionH2}>Content</h2>

              <div className={promptSurface}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className={inlineSectionLabel}>Default agent prompt</span>
                  <CopyButton
                    className="text-xs"
                    iconSize="sm"
                    label="Copy"
                    size="sm"
                    usageEvent={{
                      kind: "copy_prompt",
                      label: "Copied prompt",
                      path: skill.href,
                      skillSlug: skill.slug,
                      categorySlug: skill.category
                    }}
                    value={primaryAgentPrompt}
                    variant="soft"
                  />
                </div>
                <code className="block whitespace-pre-wrap wrap-break-word font-mono text-sm text-ink">
                  {primaryAgentPrompt}
                </code>
              </div>

              <div className={cn(promptSurface, "p-0")}>
                <ExpandableContent maxHeight={400}>
                  <div className="markdown-shell p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {skill.body}
                    </ReactMarkdown>
                  </div>
                </ExpandableContent>
              </div>
            </section>

            {/* Sources & Config */}
            <section
              className="grid gap-5 border-t border-line pt-8"
              id="sources"
            >
              <h2 className={sectionH2}>Sources &amp; config</h2>

              {skill.origin === "user" ? (
                <SkillSetupForm
                  automation={skill.automation}
                  body={skill.body}
                  category={skill.category}
                  description={skill.description}
                  ownerName={skill.ownerName}
                  slug={skill.slug}
                  sources={skill.sources ?? []}
                  tags={skill.tags}
                  title={skill.title}
                  updatedAt={skill.updatedAt}
                  versionLabel={skill.versionLabel}
                />
              ) : (
                <Panel square>
                  <h3 className={sectionTitle}>Track this skill</h3>
                  <p className="text-ink-soft">
                    Create an editable copy to add sources, configure refresh, and
                    keep it updated.
                  </p>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-none border border-line bg-paper-3/80 p-4 dark:bg-paper-2/40">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-none border border-line bg-paper-2/80 text-ink-soft dark:bg-paper-2/50">
                      <FlowIcon />
                    </span>
                    <div>
                      <strong className="text-ink">What happens</strong>
                      <p className="mt-1 text-sm text-ink-soft">
                        Loop copies this skill into your tracked set. You can then
                        edit sources and run refreshes.
                      </p>
                    </div>
                  </div>
                  <TrackSkillButton
                    label="Create editable copy"
                    redirectTo="detail"
                    slug={skill.slug}
                  />
                </Panel>
              )}

              {trackedSources.length > 0 ? (
                <Panel compact square>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                      <h3 className={sectionTitle}>Tracked sources</h3>
                      <Badge>{trackedSources.length}</Badge>
                      <span className="ml-auto text-xs text-ink-muted transition-transform group-open:rotate-90">▶</span>
                    </summary>
                    <SimpleList tight className="mt-3">
                      {trackedSources.map((ref) =>
                        "url" in ref ? (
                          <a
                            className="grid grid-cols-1 border-t border-line bg-transparent py-3 first:border-t-0 first:pt-0 transition-colors hover:bg-transparent"
                            href={ref.url}
                            key={ref.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <SimpleListBody>
                              <strong className="text-ink">{ref.label}</strong>
                              <p className="m-0 text-sm text-ink-soft">
                                {ref.tags.join(" · ") || ref.kind}
                              </p>
                            </SimpleListBody>
                          </a>
                        ) : (
                          <SimpleListItem className="grid-cols-1" key={ref.path}>
                            <SimpleListBody>
                              <strong className="text-ink">{ref.title}</strong>
                              <p className="m-0 text-sm text-ink-soft">
                                {ref.excerpt}
                              </p>
                            </SimpleListBody>
                          </SimpleListItem>
                        )
                      )}
                    </SimpleList>
                  </details>
                </Panel>
              ) : null}
            </section>

            {isUpdateable ? (
              <section className="border-t border-line pt-8" id="run-log">
                <SkillUpdateRunner
                  latestRun={latestRun}
                  origin={skill.origin === "user" ? "user" : "remote"}
                  slug={skill.slug}
                  sourceCount={sourceCount}
                />
              </section>
            ) : null}
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 w-full overflow-y-auto border-t border-line py-5 pb-16 sm:py-6 lg:w-80 lg:shrink-0 lg:border-t-0",
              pageInsetPadX
            )}
          >
            <SkillDetailSidebar
              agentDocs={skill.agentDocs}
              agentPrompt={primaryAgentPrompt}
              automations={attachedAutomations}
              currentVersion={skill.version}
              diffLines={diffLines}
              latestRun={latestRun}
              latestUpdate={latestUpdate}
              rawDiffLength={rawDiff.length}
              skillHref={skill.href}
              slug={skill.slug}
              updates={skill.updates}
              usage={usage}
              versions={skill.availableVersions}
              visibleChangedSections={visibleChangedSections}
            />
          </div>
        </div>
      </PageShell>
    </AppGridShell>
  );
}
