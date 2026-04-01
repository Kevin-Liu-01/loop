import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AppGridShell } from "@/components/app-grid-shell";
import { BuySkillButton } from "@/components/buy-skill-button";
import { CopyButton } from "@/components/copy-button";
import { DeleteSkillButton } from "@/components/delete-skill-button";
import { DownloadSkillButton } from "@/components/download-skill-button";
import { ForkSkillButton } from "@/components/fork-skill-button";
import { ExpandableContent } from "@/components/expandable-content";
import { PlayIcon } from "@/components/frontier-icons";
import { ShareButton } from "@/components/share-button";
import { SkillAgentDocsPanel } from "@/components/skill-agent-docs-panel";
import { SkillInstallPanel } from "@/components/skill-install-panel";
import { SkillAuthorBadge } from "@/components/skill-author-badge";
import { SkillAuthorStudio } from "@/components/skill-author-studio";
import { SkillActivitySection } from "@/components/skill-activity-section";
import { SkillVisibilityToggle } from "@/components/skill-visibility-toggle";
import { SkillResearchPanel } from "@/components/skill-research-panel";
import { SiteHeader } from "@/components/site-header";
import { SkillDetailSidebar } from "@/components/skill-detail-sidebar";
import { TrackSkillButton } from "@/components/track-skill-button";
import { UsageBeacon } from "@/components/usage-beacon";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { SimpleList, SimpleListBody, SimpleListItem } from "@/components/ui/simple-list";
import { VersionSwitcher } from "@/components/version-switcher";
import { buildSkillAutomationSummaries } from "@/lib/skill-automations";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { pageInsetPadX } from "@/lib/ui-layout";
import { diffMultilineText } from "@/lib/text-diff";
import { buildUpdateDigest } from "@/lib/update-digest";
import { SkillSectionNav, type SectionTab } from "@/components/skill-section-nav";
import { SkillIcon } from "@/components/ui/skill-icon";
import { getSiteUrlString } from "@/lib/seo";
import { formatTagLabel, getTagColorForCategory, getTagColorForOrigin } from "@/lib/tag-utils";
import type { SkillUsageSummary } from "@/lib/usage";
import type { CategoryBrief, LoopRunRecord, SkillRecord } from "@/lib/types";

const SITE_URL = getSiteUrlString();
const sectionH2 = "m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink";

type SkillDetailPageProps = {
  skill: SkillRecord;
  brief?: CategoryBrief;
  previousSkill?: SkillRecord | null;
  latestRun?: LoopRunRecord | null;
  usage: SkillUsageSummary;
  purchased?: boolean;
  canEdit?: boolean;
  isSignedIn?: boolean;
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

export function SkillDetailPage({
  skill,
  brief,
  previousSkill,
  latestRun,
  usage,
  purchased = false,
  canEdit = false,
  isSignedIn = false,
}: SkillDetailPageProps) {
  const isPaid = skill.price && skill.price.amount > 0;
  const priceLabel = isPaid ? formatPrice(skill.price!.amount, skill.price!.currency) : null;
  const rawUrl = `${SITE_URL}/api/skills/${skill.slug}/raw`;
  const rawUrlVersioned = skill.version > 1 ? `${rawUrl}?v=${skill.version}` : rawUrl;
  const primaryAgentPrompt = `Use the skill at ${rawUrl}`;
  const downloadFilename = `${skill.slug}-v${skill.version}.md`;
  const trackedSources =
    skill.origin === "user" ? skill.sources ?? [] : skill.references;
  const attachedAutomations = buildSkillAutomationSummaries(skill);
  const primaryAutomation = attachedAutomations[0];
  const latestUpdate = skill.updates?.[0];

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

  const sectionTabs: SectionTab[] = [
    ...(canEdit ? [{ id: "author-studio", label: "Studio" }] : []),
    { id: "install", label: "Install" },
    { id: "content", label: "Content" },
    { id: "agent-docs", label: "Agent docs" },
    { id: "activity", label: "Activity" },
    { id: "research", label: "Research" },
    ...(trackedSources.length > 0 ? [{ id: "sources", label: "Sources" }] : []),
  ];

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
        {/* ── Header ── */}
        <div className={cn("shrink-0 border-b border-line py-4", pageInsetPadX)}>
          <header className="grid gap-4">
            <Link
              className="w-fit text-xs font-medium text-ink-faint transition-colors hover:text-ink"
              href="/"
            >
              &larr; Back to skills
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Badge color={getTagColorForCategory(skill.category)}>{formatTagLabel(skill.category)}</Badge>
              <Badge color={getTagColorForOrigin(skill.origin)}>{formatTagLabel(skill.origin)}</Badge>
              <Badge color="neutral">{skill.versionLabel}</Badge>
              {priceLabel ? <Badge color="green">{priceLabel}</Badge> : <Badge color="neutral">Free</Badge>}
              <SkillVisibilityToggle
                canEdit={canEdit}
                currentVisibility={skill.visibility}
                slug={skill.slug}
              />
              {skill.forkedFromSlug && (
                <Badge color="purple">Forked from {skill.forkedFromSlug}</Badge>
              )}
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <SkillIcon className="rounded-lg" iconUrl={skill.iconUrl} size={36} slug={skill.slug} />
              <h1 className="m-0 font-serif text-2xl font-medium tracking-[-0.03em] text-ink wrap-break-word">
                {skill.title}
              </h1>
              <ShareButton href={skill.href} />
              {skill.availableVersions.length > 1 && (
                <VersionSwitcher
                  className="ml-auto"
                  currentVersion={skill.version}
                  slug={skill.slug}
                  versions={skill.availableVersions}
                />
              )}
            </div>
            <p className="m-0 max-w-[min(100%,52ch)] text-pretty text-sm leading-relaxed text-ink-muted wrap-break-word">
              {skill.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <SkillAuthorBadge author={skill.author} ownerName={skill.ownerName} iconUrl={skill.iconUrl} />
              <span className="text-xs tabular-nums text-ink-faint">
                {trackedSources.length} sources · Updated {formatRelativeDate(skill.updatedAt)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPaid && priceLabel ? (
                <BuySkillButton
                  priceLabel={priceLabel}
                  purchased={purchased}
                  slug={skill.slug}
                />
              ) : null}
              <LinkButton
                grain
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
                  categorySlug: skill.category,
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
                  label: "Copied raw skill link",
                  path: skill.href,
                  skillSlug: skill.slug,
                  categorySlug: skill.category,
                }}
                value={rawUrlVersioned}
                variant="soft"
              />
              <DownloadSkillButton body={skill.body} filename={downloadFilename} />
              {!canEdit && (
                <ForkSkillButton label="Fork to my skills" slug={skill.slug} />
              )}
              {canEdit && (
                <DeleteSkillButton skillTitle={skill.title} slug={skill.slug} />
              )}
            </div>
          </header>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Main column */}
          <div
            className="min-h-0 flex-1 border-line lg:border-r"
            id="skill-main-scroll"
          >
            <SkillSectionNav sections={sectionTabs} />
            <div className={cn("grid gap-8 py-5 pb-16 sm:py-6", pageInsetPadX)}>
              {canEdit ? (
                <section id="author-studio">
                  <SkillAuthorStudio skill={skill} />
                </section>
              ) : null}

              <SkillInstallPanel
                agentDocs={skill.agentDocs}
                agentPrompt={primaryAgentPrompt}
                body={skill.body}
                downloadFilename={downloadFilename}
                rawUrl={rawUrl}
                skillHref={skill.href}
                slug={skill.slug}
              />

              {/* Skill body */}
              <section aria-label="Skill content" id="content">
                <div className="overflow-hidden rounded-none border border-line bg-paper-2/50 dark:bg-paper-2/25">
                  <ExpandableContent maxHeight={600}>
                    <div className="markdown-shell p-5 sm:p-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {skill.body}
                      </ReactMarkdown>
                    </div>
                  </ExpandableContent>
                </div>
              </section>

              {/* Agent docs (tabs per platform) */}
              <SkillAgentDocsPanel
                agentDocs={skill.agentDocs}
                skillHref={skill.href}
                skillSlug={skill.slug}
              />

              <SkillActivitySection
                automation={primaryAutomation}
                canManage={canEdit}
                category={skill.category}
                iconUrl={skill.iconUrl}
                latestRun={latestRun}
                origin={skill.origin}
                skillTitle={skill.title}
                slug={skill.slug}
                sourceCount={sourceCount}
                sources={skill.sources}
              />

              <SkillResearchPanel skill={skill} />

              {/* Sources list */}
              {trackedSources.length > 0 ? (
                <section className="border-t border-line pt-8" id="sources">
                  <h2 className={sectionH2}>Sources</h2>
                  <Panel compact square className="mt-4">
                    <SimpleList tight>
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
                                {[
                                  ref.tags.join(" · ") || ref.kind,
                                  ref.mode ? `Mode: ${ref.mode}` : null,
                                  ref.trust ? `Trust: ${ref.trust}` : null,
                                  ref.parser ? `Parser: ${ref.parser}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </SimpleListBody>
                          </a>
                        ) : (
                          <SimpleListItem className="grid-cols-1" key={ref.path}>
                            <SimpleListBody>
                              <strong className="text-ink">{ref.title}</strong>
                              <p className="m-0 text-sm text-ink-soft">{ref.excerpt}</p>
                            </SimpleListBody>
                          </SimpleListItem>
                        )
                      )}
                    </SimpleList>
                  </Panel>
                </section>
              ) : null}
            </div>
          </div>

          {/* Sidebar */}
          <div
            className={cn(
              "min-h-0 w-full overflow-y-auto border-t border-line py-5 pb-16 sm:py-6 lg:w-96 lg:shrink-0 lg:border-t-0",
              pageInsetPadX
            )}
          >
            <SkillDetailSidebar
              agentPrompt={primaryAgentPrompt}
              automations={attachedAutomations}
              currentVersion={skill.version}
              diffLines={diffLines}
              latestRun={latestRun}
              latestUpdate={latestUpdate}
              rawDiffLength={rawDiff.length}
              skillHref={skill.href}
              skills={[skill]}
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
