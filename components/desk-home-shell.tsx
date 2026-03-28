import Link from "next/link";

import {
  ArrowRightIcon,
  CubeStackIcon,
  DownloadIcon,
  PencilIcon,
  PulseIcon,
  TimelineIcon
} from "@/components/frontier-icons";
import { SkillsExplorer } from "@/components/skills-explorer";
import { formatDateTime } from "@/lib/format";
import type { AutomationSummary, CategoryDefinition, RefreshRunRecord, SkillRecord } from "@/lib/types";

type DeskHomeShellProps = {
  categories: CategoryDefinition[];
  skills: SkillRecord[];
  automations: AutomationSummary[];
  latestRun: RefreshRunRecord | null;
};

function sortByUpdatedAt(skills: SkillRecord[]): SkillRecord[] {
  return skills.slice().sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt));
}

export function DeskHomeShell({
  categories,
  skills,
  automations,
  latestRun
}: DeskHomeShellProps) {
  const recentSkills = sortByUpdatedAt(skills.filter((skill) => (skill.updates?.length ?? 0) > 0)).slice(0, 5);
  const trackedPool = sortByUpdatedAt(skills.filter((skill) => skill.origin === "user"));
  const trackedSkills = trackedPool.slice(0, 4);
  const activeAutomations = automations.filter((automation) => automation.status === "ACTIVE").length;

  return (
    <main className="page-shell page-shell--narrow workspace-shell">
      <section className="workspace-hero workspace-hero--home">
        <div className="workspace-hero__copy">
          <span className="section-kicker">Catalog</span>
          <h1>Find it. Set it up. Refresh it.</h1>
          <p className="lede">Everything important stays on one path.</p>
        </div>

        <div className="workspace-actions">
          <Link className="button" href="/skills/new#import">
            Import URL
          </Link>
          <Link className="button button--ghost" href="/skills/new#create">
            New loop
          </Link>
          <Link className="button button--ghost" href="/admin#updates">
            Open updates
          </Link>
        </div>
      </section>

      <section className="journey-strip" aria-label="Core journeys">
        <article className="journey-step">
          <span className="journey-step__icon">
            <CubeStackIcon />
          </span>
          <div>
            <strong>Find</strong>
            <p>Search the catalog fast.</p>
          </div>
        </article>
        <article className="journey-step">
          <span className="journey-step__icon">
            <PencilIcon />
          </span>
          <div>
            <strong>Set up</strong>
            <p>Add sources. Edit prompts.</p>
          </div>
        </article>
        <article className="journey-step">
          <span className="journey-step__icon">
            <PulseIcon />
          </span>
          <div>
            <strong>Refresh</strong>
            <p>Watch logs. Read diffs.</p>
          </div>
        </article>
      </section>

      <section className="workspace-secondary workspace-secondary--topline">
        <article className="surface-panel surface-panel--compact">
          <div className="surface-panel__head">
            <div>
              <span className="section-kicker">Quick start</span>
              <h2>Three clean entries</h2>
            </div>
          </div>
          <div className="quick-entry-grid">
            <Link className="quick-entry" href="/#catalog">
              <span className="quick-entry__icon">
                <CubeStackIcon />
              </span>
              <div>
                <strong>Browse catalog</strong>
                <p>Start from a known skill.</p>
              </div>
              <ArrowRightIcon />
            </Link>
            <Link className="quick-entry" href="/skills/new#import">
              <span className="quick-entry__icon">
                <DownloadIcon />
              </span>
              <div>
                <strong>Import your own</strong>
                <p>Bring markdown in.</p>
              </div>
              <ArrowRightIcon />
            </Link>
            <Link className="quick-entry" href="/admin#automations">
              <span className="quick-entry__icon">
                <TimelineIcon />
              </span>
              <div>
                <strong>Open automations</strong>
                <p>Schedule tracked loops.</p>
              </div>
              <ArrowRightIcon />
            </Link>
          </div>
        </article>

        <article className="surface-panel surface-panel--compact">
          <div className="surface-panel__head">
            <div>
              <span className="section-kicker">Now</span>
              <h2>Current desk</h2>
            </div>
          </div>
          <div className="inline-stats inline-stats--compact">
            <div>
              <small>catalog</small>
              <strong>{skills.length}</strong>
            </div>
            <div>
              <small>tracked</small>
              <strong>{trackedPool.length}</strong>
            </div>
            <div>
              <small>active runs</small>
              <strong>{activeAutomations}</strong>
            </div>
            <div>
              <small>last refresh</small>
              <strong>{latestRun?.startedAt ? formatDateTime(latestRun.startedAt) : "none"}</strong>
            </div>
          </div>
        </article>
      </section>

      <section id="catalog">
        <SkillsExplorer categories={categories} skills={skills} />
      </section>

      <section className="workspace-secondary">
        <article className="surface-panel">
          <div className="surface-panel__head">
            <div>
              <span className="section-kicker">Recent</span>
              <h2>Recent updates</h2>
            </div>
            <small>{recentSkills.length} skills</small>
          </div>

          <div className="simple-list">
            {recentSkills.length > 0 ? (
              recentSkills.map((skill) => (
                <Link className="simple-list__item simple-list__item--link" href={skill.href} key={skill.href}>
                  <div className="simple-list__icon">
                    <TimelineIcon />
                  </div>
                  <div className="simple-list__body">
                    <div className="simple-list__row">
                      <strong>{skill.title}</strong>
                      <span>{skill.versionLabel}</span>
                    </div>
                    <div className="simple-list__meta">
                      <span>{skill.category}</span>
                      <span>{formatDateTime(skill.updatedAt)}</span>
                    </div>
                    <p>{skill.updates?.[0]?.whatChanged ?? skill.description}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-card">No update trail yet.</div>
            )}
          </div>
        </article>

        <aside className="surface-panel surface-panel--compact">
          <div className="surface-panel__head">
            <div>
              <span className="section-kicker">Tracked</span>
              <h2>Open a setup</h2>
            </div>
          </div>

          <div className="simple-list simple-list--tight">
            {trackedSkills.length > 0 ? (
              trackedSkills.map((skill) => (
                <Link className="simple-list__item simple-list__item--link" href={skill.href} key={skill.href}>
                  <div className="simple-list__body">
                    <div className="simple-list__row">
                      <strong>{skill.title}</strong>
                      <span>{skill.versionLabel}</span>
                    </div>
                    <div className="simple-list__meta">
                      <span>{skill.category}</span>
                      <span>{skill.sources?.length ?? 0} sources</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-card">Track a skill first.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
