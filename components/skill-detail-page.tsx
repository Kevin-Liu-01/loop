import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CopyButton } from "@/components/copy-button";
import { FlowIcon, PulseIcon } from "@/components/frontier-icons";
import { SkillObservabilityPanel } from "@/components/observability-panels";
import { SiteHeader } from "@/components/site-header";
import { SkillSetupForm } from "@/components/skill-setup-form";
import { TrackSkillButton } from "@/components/track-skill-button";
import { UsageBeacon } from "@/components/usage-beacon";
import { buildSkillVersionHref, formatAutomationSchedule, formatDateTime } from "@/lib/format";
import { diffMultilineText } from "@/lib/text-diff";
import { buildUpdateDigest } from "@/lib/update-digest";
import type { SkillUsageSummary } from "@/lib/usage";
import type { CategoryBrief, LoopRunRecord, SkillRecord } from "@/lib/types";

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
        schedule: skill.automation.enabled ? `${skill.automation.cadence} ${skill.automation.status}` : "manual",
        href: "/admin#automations"
      },
      ...skill.automations.map((automation) => ({
        id: automation.id,
        name: automation.name,
        schedule: formatAutomationSchedule(automation.schedule),
        href: "/admin#automations"
      }))
    ];
  }

  return skill.automations.map((automation) => ({
    id: automation.id,
    name: automation.name,
    schedule: formatAutomationSchedule(automation.schedule),
    href: "/admin#automations"
  }));
}

export function SkillDetailPage({ skill, brief, previousSkill, latestRun, usage }: SkillDetailPageProps) {
  const primaryAgentPrompt = skill.agents[0]?.defaultPrompt ?? `Use $${skill.slug} for this task.`;
  const latestUpdate = skill.updates?.[0];
  const trackedSources = skill.origin === "user" ? skill.sources ?? [] : skill.references;
  const attachedAutomations = buildAttachedAutomations(skill);
  const versionCount = skill.availableVersions.length;
  const updateCount = skill.updates?.length ?? 0;
  const latestUpdateGeneratedAt = latestUpdate?.generatedAt ?? skill.updatedAt;
  const updateDigestDiff =
    latestUpdate || previousSkill?.updates?.[0]
      ? diffMultilineText(buildUpdateDigest(previousSkill?.updates?.[0]), buildUpdateDigest(latestUpdate))
      : [];
  const rawDiff =
    updateDigestDiff.length > 0
      ? updateDigestDiff
      : previousSkill
        ? diffMultilineText(previousSkill.body, skill.body)
        : [];
  const diffLines = rawDiff.length > 120 ? rawDiff.slice(0, 120) : rawDiff;
  const sourceSignals =
    skill.origin === "user" ? latestUpdate?.items ?? [] : brief?.items.slice(0, 5) ?? [];
  const visibleSourceLogs = latestRun?.sources ?? [];
  const visibleRunMessages = latestRun?.messages ?? [];
  const visibleChangedSections = latestUpdate?.changedSections ?? latestRun?.changedSections ?? [];
  const visibleBodyChanged = latestUpdate?.bodyChanged ?? latestRun?.bodyChanged;
  const visibleEditorModel = latestUpdate?.editorModel ?? latestRun?.editorModel;

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
      <SiteHeader
        sections={[
          { href: "/", label: "Catalog" },
          { href: "/skills/new", label: "Add" },
          { href: "/admin", label: "Updates" },
          { href: skill.href, label: skill.versionLabel }
        ]}
      />

      <main className="page-shell page-shell--narrow skill-page-shell">
        <section className="skill-summary">
          <div className="skill-summary__main">
            <div className="skill-summary__meta">
              <span>{skill.category}</span>
              <span>{skill.origin}</span>
              <span>{skill.versionLabel}</span>
            </div>
            <h1>{skill.title}</h1>
            <p className="lede">{skill.description}</p>
          </div>

          <div className="skill-summary__actions">
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
            {skill.origin === "user" ? (
              <Link className="button button--ghost" href="/admin#updates">
                Open updates
              </Link>
            ) : (
              <TrackSkillButton label="Set up skill" redirectTo="detail" slug={skill.slug} />
            )}
          </div>
        </section>

        <section className="surface-panel skill-use-panel">
          <div className="surface-panel__head">
            <div>
              <span className="section-kicker">Use</span>
              <h2>Use this skill</h2>
            </div>
          </div>

          <div className="skill-flow">
            <div className="skill-flow__step">
              <small>1</small>
              <strong>Copy prompt</strong>
              <span>Use this version.</span>
            </div>
            <div className="skill-flow__divider" aria-hidden="true" />
            <div className="skill-flow__step">
              <small>2</small>
              <strong>Run it</strong>
              <span>Reference ${skill.slug}.</span>
            </div>
            <div className="skill-flow__divider" aria-hidden="true" />
            <div className="skill-flow__step">
              <small>3</small>
              <strong>Check changes</strong>
              <span>Read the latest diff.</span>
            </div>
          </div>

          <div className="prompt-shell">
            <code>{primaryAgentPrompt}</code>
          </div>

          <div className="inline-stats inline-stats--wide">
            <div>
              <small>version</small>
              <strong>{skill.versionLabel}</strong>
            </div>
            <div>
              <small>versions</small>
              <strong>{versionCount}</strong>
            </div>
            <div>
              <small>updates</small>
              <strong>{updateCount}</strong>
            </div>
            <div>
              <small>sources</small>
              <strong>{trackedSources.length}</strong>
            </div>
            <div>
              <small>automations</small>
              <strong>{attachedAutomations.length}</strong>
            </div>
            <div>
              <small>updated</small>
              <strong>{formatDateTime(skill.updatedAt)}</strong>
            </div>
          </div>
        </section>

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
          <section className="surface-panel skill-setup-cta">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Setup</span>
                <h2>Make this editable</h2>
              </div>
            </div>
            <p className="section-copy">Create your copy. Then add sources and refresh it.</p>
            <div className="workflow-hint">
              <span className="workflow-hint__icon">
                <FlowIcon />
              </span>
              <div>
                <strong>What happens</strong>
                <p>Loop copies this skill. Then setup opens.</p>
              </div>
            </div>
            <div className="hero-actions">
              <TrackSkillButton label="Create editable copy" redirectTo="detail" slug={skill.slug} />
            </div>
          </section>
        )}

        <section className="skill-detail-stack">
          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Latest</span>
                <h2>Latest update</h2>
              </div>
            </div>

            <div className="update-summary__head">
              <div>
                <small>refresh</small>
                <strong>{formatDateTime(latestUpdateGeneratedAt)}</strong>
              </div>
              <div>
                <small>signals</small>
                <strong>{latestUpdate?.items.length ?? sourceSignals.length}</strong>
              </div>
              <div>
                <small>body edits</small>
                <strong>{visibleBodyChanged === undefined ? "pending" : visibleBodyChanged ? "yes" : "no"}</strong>
              </div>
              <div>
                <small>sections</small>
                <strong>{visibleChangedSections.length || 0}</strong>
              </div>
              <div>
                <small>editor</small>
                <strong>{visibleEditorModel ?? "heuristic"}</strong>
              </div>
              <div>
                <small>next step</small>
                <strong>{skill.origin === "user" ? "refresh again" : "set up"}</strong>
              </div>
            </div>

            {latestUpdate ? (
              <div className="update-summary__copy">
                <p>{latestUpdate.summary}</p>
                {latestUpdate.whatChanged ? <p>{latestUpdate.whatChanged}</p> : null}
                {visibleChangedSections.length > 0 ? <p>Changed: {visibleChangedSections.join(", ")}</p> : null}
              </div>
            ) : (
              <div className="empty-card">No update summary yet.</div>
            )}
          </article>

          <SkillObservabilityPanel usage={usage} />

          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Sources</span>
                <h2>Sources searched</h2>
              </div>
            </div>

            {visibleSourceLogs.length > 0 ? (
              <div className="loop-source-grid">
                {visibleSourceLogs.map((source) => (
                  <article className="loop-source-card" key={source.id}>
                    <div className="loop-source-card__head">
                      <span className="loop-source-card__logo">
                        {source.logoUrl ? <img alt="" height={28} src={source.logoUrl} width={28} /> : null}
                      </span>
                      <div>
                        <strong>{source.label}</strong>
                        <small>{source.status}</small>
                      </div>
                    </div>
                    <p>{source.note ?? `${source.itemCount} items found.`}</p>
                    <div className="loop-source-card__items">
                      {source.items.slice(0, 3).map((item) => (
                        <a href={item.url} key={item.url} rel="noreferrer" target="_blank">
                          {item.title}
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : sourceSignals.length > 0 ? (
              <div className="detail-signal-list">
                {sourceSignals.map((item) => (
                  <a className="detail-signal-item" href={item.url} key={item.url} rel="noreferrer" target="_blank">
                    <strong>{item.title}</strong>
                    <span>
                      {item.source} · {formatDateTime(item.publishedAt)}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="empty-card">No source log yet.</div>
            )}
          </article>

          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Log</span>
                <h2>Agent log</h2>
              </div>
            </div>

            <div className="frontier-log-list">
              {visibleRunMessages.length > 0 ? (
                visibleRunMessages.map((message, index) => (
                  <article className="frontier-log-item" key={`${message}-${index}`}>
                    <div className="frontier-log-item__icon">
                      <FlowIcon />
                    </div>
                    <div>
                      <strong>Step {index + 1}</strong>
                      <span>{message}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-card">No stored run log yet.</div>
              )}
            </div>
          </article>

          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Diff</span>
                <h2>Latest diff</h2>
              </div>
            </div>

            {previousSkill ? (
              <div className="loop-diff-shell loop-diff-shell--compact">
                {diffLines.map((line, index) => (
                  <div className={`loop-diff-line loop-diff-line--${line.type}`} key={`${line.type}-${index}`}>
                    <span>{line.leftNumber ?? ""}</span>
                    <span>{line.rightNumber ?? ""}</span>
                    <code>{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</code>
                    <code>{line.value || " "}</code>
                  </div>
                ))}
                {rawDiff.length > diffLines.length ? <p className="detail-note">Showing the first {diffLines.length} lines.</p> : null}
              </div>
            ) : (
              <div className="empty-card">No previous version yet.</div>
            )}
          </article>

          <div className="skill-detail-grid">
            <article className="surface-panel">
              <div className="surface-panel__head">
                <div>
                  <span className="section-kicker">Versions</span>
                  <h2>Version history</h2>
                </div>
              </div>

              <div className="version-track">
                {skill.availableVersions.map((version) => (
                  <Link
                    className={version.version === skill.version ? "version-pill version-pill--active" : "version-pill"}
                    href={buildSkillVersionHref(skill.slug, version.version)}
                    key={version.version}
                  >
                    {version.label}
                  </Link>
                ))}
              </div>

              <div className="simple-list simple-list--tight">
                {skill.availableVersions.map((version) => (
                  <Link
                    className="simple-list__item simple-list__item--link"
                    href={buildSkillVersionHref(skill.slug, version.version)}
                    key={version.version}
                  >
                    <div className="simple-list__body">
                      <div className="simple-list__row">
                        <strong>{version.label}</strong>
                        <span>{formatDateTime(version.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="surface-panel">
              <div className="surface-panel__head">
                <div>
                  <span className="section-kicker">Sources</span>
                  <h2>Tracked watchlist</h2>
                </div>
              </div>

              <div className="simple-list simple-list--tight">
                {trackedSources.length > 0 ? (
                  trackedSources.map((reference) =>
                    "url" in reference ? (
                      <a className="simple-list__item simple-list__item--link" href={reference.url} key={reference.url} rel="noreferrer" target="_blank">
                        <div className="simple-list__body">
                          <strong>{reference.label}</strong>
                          <p>{reference.tags.join(" · ") || reference.kind}</p>
                        </div>
                      </a>
                    ) : (
                      <article className="simple-list__item" key={reference.path}>
                        <div className="simple-list__body">
                          <strong>{reference.title}</strong>
                          <p>{reference.excerpt}</p>
                        </div>
                      </article>
                    )
                  )
                ) : (
                  <div className="empty-card">No sources listed yet.</div>
                )}
              </div>
            </article>

            <article className="surface-panel">
              <div className="surface-panel__head">
                <div>
                  <span className="section-kicker">Automations</span>
                  <h2>Schedules</h2>
                </div>
              </div>

              <div className="simple-list simple-list--tight">
                {attachedAutomations.length > 0 ? (
                  attachedAutomations.map((automation) => (
                    <Link className="simple-list__item simple-list__item--link" href={automation.href} key={automation.id}>
                      <div className="simple-list__body">
                        <div className="simple-list__row">
                          <strong>{automation.name}</strong>
                          <span>{automation.schedule}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="empty-card">No automation yet.</div>
                )}
              </div>
            </article>
          </div>

          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Reference</span>
                <h2>Full skill</h2>
              </div>
            </div>

            <div className="markdown-shell markdown-shell--simple">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.body}</ReactMarkdown>
            </div>
          </article>

          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">History</span>
                <h2>Update history</h2>
              </div>
            </div>

            <div className="simple-list">
              {skill.updates && skill.updates.length > 0 ? (
                skill.updates.map((entry) => (
                  <article className="simple-list__item" key={entry.generatedAt}>
                    <div className="simple-list__icon">
                      <PulseIcon />
                    </div>
                    <div className="simple-list__body">
                      <div className="simple-list__row">
                        <strong>{formatDateTime(entry.generatedAt)}</strong>
                        <span>{entry.items.length} sources</span>
                      </div>
                      <p>{entry.summary}</p>
                      {entry.whatChanged ? <p>{entry.whatChanged}</p> : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-card">No update history yet.</div>
              )}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
