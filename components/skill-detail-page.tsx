import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CopyButton } from "@/components/copy-button";
import { FlowIcon, PlayIcon, PulseIcon } from "@/components/frontier-icons";
import { SkillObservabilityPanel } from "@/components/observability-panels";
import { SiteHeader } from "@/components/site-header";
import { SkillSetupForm } from "@/components/skill-setup-form";
import { SkillUpdateRunner } from "@/components/skill-update-runner";
import { TrackSkillButton } from "@/components/track-skill-button";
import { UsageBeacon } from "@/components/usage-beacon";
import { Badge } from "@/components/ui/badge";
import { EmptyCard } from "@/components/ui/empty-card";
import { LinkButton } from "@/components/ui/link-button";
import { PageShell } from "@/components/ui/page-shell";
import { Panel, PanelHead } from "@/components/ui/panel";
import { SimpleList, SimpleListBody, SimpleListIcon, SimpleListItem, SimpleListRow } from "@/components/ui/simple-list";
import { buildSkillVersionHref, formatAutomationSchedule, formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { diffMultilineText } from "@/lib/text-diff";
import { buildUpdateDigest } from "@/lib/update-digest";
import type { SkillUsageSummary } from "@/lib/usage";
import type { CategoryBrief, LoopRunRecord, SkillRecord } from "@/lib/types";

const sectionTitle = "m-0 text-lg font-semibold tracking-tight text-ink";

type SkillDetailPageProps = {
  skill: SkillRecord;
  brief?: CategoryBrief;
  previousSkill?: SkillRecord | null;
  latestRun?: LoopRunRecord | null;
  usage: SkillUsageSummary;
};

function buildAttachedAutomations(skill: SkillRecord) {
  if (skill.origin === "user" && skill.automation) {
    return [
      {
        id: `built-in:${skill.slug}`,
        name: skill.automation.enabled ? `${skill.title} refresh` : "Manual refresh",
        schedule: skill.automation.enabled
          ? `${skill.automation.cadence} ${skill.automation.status}`
          : "manual"
      },
      ...skill.automations.map((a) => ({
        id: a.id,
        name: a.name,
        schedule: formatAutomationSchedule(a.schedule)
      }))
    ];
  }

  return skill.automations.map((a) => ({
    id: a.id,
    name: a.name,
    schedule: formatAutomationSchedule(a.schedule)
  }));
}

export function SkillDetailPage({
  skill,
  brief,
  previousSkill,
  latestRun,
  usage
}: SkillDetailPageProps) {
  const primaryAgentPrompt =
    skill.agents[0]?.defaultPrompt ?? `Use $${skill.slug} for this task.`;
  const trackedSources =
    skill.origin === "user" ? skill.sources ?? [] : skill.references;
  const attachedAutomations = buildAttachedAutomations(skill);
  const latestUpdate = skill.updates?.[0];
  const sourceCount =
    skill.origin === "user"
      ? (skill.sources ?? []).length
      : skill.references.length;
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
    <>
      <UsageBeacon
        categorySlug={skill.category}
        dedupeKey={`page:${skill.href}`}
        kind="page_view"
        label="Opened skill detail"
        path={skill.href}
        skillSlug={skill.slug}
      />
      <SiteHeader />

      <PageShell narrow className="grid gap-8 pt-8 pb-16">
        {/* ── Header ── */}
        <header className="grid gap-3">
          <Link
            className="text-sm text-ink-soft hover:text-ink"
            href="/"
          >
            &larr; Back to skills
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>{skill.category}</Badge>
            <Badge muted>{skill.origin}</Badge>
            <Badge muted>{skill.versionLabel}</Badge>
            <Badge muted>{trackedSources.length} sources</Badge>
            <Badge muted>{formatRelativeDate(skill.updatedAt)}</Badge>
          </div>

          <h1 className="m-0 text-2xl font-semibold tracking-tight text-ink">
            {skill.title}
          </h1>
          <p className="m-0 text-sm text-ink-soft">{skill.description}</p>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              label="Copy prompt"
              usageEvent={{
                kind: "copy_prompt",
                label: "Copied prompt",
                path: skill.href,
                skillSlug: skill.slug,
                categorySlug: skill.category
              }}
              value={primaryAgentPrompt}
            />
            <CopyButton
              label="Copy URL"
              usageEvent={{
                kind: "copy_url",
                label: "Copied skill link",
                path: skill.href,
                skillSlug: skill.slug,
                categorySlug: skill.category
              }}
              value={skill.href}
            />
            {skill.origin !== "user" ? (
              <TrackSkillButton
                label="Track skill"
                redirectTo="detail"
                slug={skill.slug}
              />
            ) : null}
            <LinkButton
              href={`/sandbox?skill=${skill.slug}`}
              size="sm"
              variant="ghost"
            >
              <PlayIcon className="h-3 w-3" />
              Run in sandbox
            </LinkButton>
          </div>
        </header>

        {/* ── Section 1: Content ── */}
        <section id="content" className="grid gap-5">
          <h2 className={sectionTitle}>Content</h2>

          <div className="rounded-2xl border border-line bg-paper-3 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                Agent prompt
              </span>
              <CopyButton
                label="Copy"
                usageEvent={{
                  kind: "copy_prompt",
                  label: "Copied prompt",
                  path: skill.href,
                  skillSlug: skill.slug,
                  categorySlug: skill.category
                }}
                value={primaryAgentPrompt}
              />
            </div>
            <code className="block whitespace-pre-wrap wrap-break-word font-mono text-sm text-ink">
              {primaryAgentPrompt}
            </code>
          </div>

          <div className="markdown-shell markdown-shell--simple">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {skill.body}
            </ReactMarkdown>
          </div>
        </section>

        {/* ── Section 2: Sources & Config ── */}
        <section id="sources" className="grid gap-5">
          <h2 className={sectionTitle}>Sources &amp; Config</h2>

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
            <Panel>
              <h3 className={sectionTitle}>Track this skill</h3>
              <p className="text-ink-soft">
                Create an editable copy to add sources, configure refresh, and
                keep it updated.
              </p>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-line bg-paper-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-3 text-ink-soft">
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
            <Panel compact>
              <PanelHead>
                <h3 className={sectionTitle}>Tracked sources</h3>
                <Badge>{trackedSources.length}</Badge>
              </PanelHead>
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
            </Panel>
          ) : null}

          {attachedAutomations.length > 0 ? (
            <Panel compact>
              <PanelHead>
                <h3 className={sectionTitle}>Automations</h3>
              </PanelHead>
              <SimpleList tight>
                {attachedAutomations.map((auto) => (
                  <SimpleListItem className="grid-cols-1" key={auto.id}>
                    <SimpleListBody>
                      <SimpleListRow>
                        <strong className="text-ink">{auto.name}</strong>
                        <span className="text-sm text-ink-soft">
                          {auto.schedule}
                        </span>
                      </SimpleListRow>
                    </SimpleListBody>
                  </SimpleListItem>
                ))}
              </SimpleList>
            </Panel>
          ) : null}
        </section>

        {/* ── Section 3: Activity ── */}
        <section id="activity" className="grid gap-5">
          <h2 className={sectionTitle}>Activity</h2>

          <SkillUpdateRunner
            latestRun={latestRun}
            origin={skill.origin === "user" ? "user" : "remote"}
            slug={skill.slug}
            sourceCount={sourceCount}
          />

          {latestUpdate ? (
            <Panel compact>
              <PanelHead>
                <h3 className={sectionTitle}>Latest refresh</h3>
                <Badge>
                  {formatRelativeDate(latestUpdate.generatedAt)}
                </Badge>
              </PanelHead>
              <p className="text-ink-soft">{latestUpdate.summary}</p>
              {latestUpdate.whatChanged ? (
                <p className="text-ink-soft">{latestUpdate.whatChanged}</p>
              ) : null}
              {visibleChangedSections.length > 0 ? (
                <p className="text-ink-soft">
                  Sections changed: {visibleChangedSections.join(", ")}
                </p>
              ) : null}
            </Panel>
          ) : null}

          {diffLines.length > 0 ? (
            <Panel compact>
              <PanelHead>
                <h3 className={sectionTitle}>Diff</h3>
              </PanelHead>
              <div className="loop-diff-shell loop-diff-shell--compact">
                {diffLines.map((line, index) => (
                  <div
                    className={`loop-diff-line loop-diff-line--${line.type}`}
                    key={`${line.type}-${index}`}
                  >
                    <span>{line.leftNumber ?? ""}</span>
                    <span>{line.rightNumber ?? ""}</span>
                    <code>
                      {line.type === "added"
                        ? "+"
                        : line.type === "removed"
                          ? "-"
                          : " "}
                    </code>
                    <code>{line.value || " "}</code>
                  </div>
                ))}
                {rawDiff.length > diffLines.length ? (
                  <p className="mt-3 text-sm text-ink-soft">
                    Showing first {diffLines.length} of {rawDiff.length} lines.
                  </p>
                ) : null}
              </div>
            </Panel>
          ) : null}

          {skill.updates && skill.updates.length > 1 ? (
            <Panel compact>
              <PanelHead>
                <h3 className={sectionTitle}>Update history</h3>
              </PanelHead>
              <SimpleList tight>
                {skill.updates.map((entry) => (
                  <SimpleListItem key={entry.generatedAt}>
                    <SimpleListIcon>
                      <PulseIcon />
                    </SimpleListIcon>
                    <SimpleListBody>
                      <SimpleListRow>
                        <strong className="text-ink">
                          {formatRelativeDate(entry.generatedAt)}
                        </strong>
                        <span className="text-sm text-ink-soft">
                          {entry.items.length} sources
                        </span>
                      </SimpleListRow>
                      <p className="m-0 text-sm text-ink-soft">
                        {entry.summary}
                      </p>
                    </SimpleListBody>
                  </SimpleListItem>
                ))}
              </SimpleList>
            </Panel>
          ) : null}

          <Panel compact>
            <PanelHead>
              <h3 className={sectionTitle}>Versions</h3>
            </PanelHead>
            <div className="flex flex-wrap gap-2">
              {skill.availableVersions.map((version) => (
                <Link
                  className={cn(
                    "inline-flex items-center rounded-full border border-line bg-paper-3 px-3 py-1.5 text-sm text-ink-soft transition-colors",
                    version.version === skill.version &&
                      "border-accent bg-accent text-white"
                  )}
                  href={buildSkillVersionHref(skill.slug, version.version)}
                  key={version.version}
                >
                  {version.label} · {formatRelativeDate(version.updatedAt)}
                </Link>
              ))}
            </div>
          </Panel>

          <SkillObservabilityPanel usage={usage} />
        </section>
      </PageShell>
    </>
  );
}
