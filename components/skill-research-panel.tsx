import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatTagLabel } from "@/lib/tag-utils";
import type { SkillRecord } from "@/lib/types";

type SkillResearchPanelProps = {
  skill: SkillRecord;
};

export function SkillResearchPanel({ skill }: SkillResearchPanelProps) {
  const profile = skill.researchProfile;
  const trackedSources = skill.sources ?? [];

  if (!profile && trackedSources.length === 0 && (skill.upstreams?.length ?? 0) === 0) {
    return null;
  }

  const modeCounts = new Map<string, number>();
  const trustCounts = new Map<string, number>();

  for (const source of trackedSources) {
    if (source.mode) {
      modeCounts.set(source.mode, (modeCounts.get(source.mode) ?? 0) + 1);
    }

    if (source.trust) {
      trustCounts.set(source.trust, (trustCounts.get(source.trust) ?? 0) + 1);
    }
  }

  return (
    <section className="grid gap-5 border-t border-line pt-8" id="research">
      <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
        Research engine
      </h2>

      <Panel compact square>
        <div className="grid gap-4">
          {profile?.summary ? (
            <p className="m-0 max-w-[68ch] text-sm leading-relaxed text-ink-soft">
              {profile.summary}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Badge color="blue">{trackedSources.length} sources</Badge>
            {Array.from(modeCounts.entries()).map(([mode, count]) => (
              <Badge color="teal" key={mode}>
                {count} {formatTagLabel(mode)}
              </Badge>
            ))}
            {Array.from(trustCounts.entries()).map(([trust, count]) => (
              <Badge color="amber" key={trust}>
                {count} {formatTagLabel(trust)}
              </Badge>
            ))}
            {skill.featuredRank ? <Badge color="purple">Rank {skill.featuredRank}</Badge> : null}
            {skill.qualityScore ? <Badge color="green">Quality {skill.qualityScore}</Badge> : null}
          </div>

          {profile?.featuredReason ? (
            <div className="grid gap-1.5 rounded-none border border-line bg-paper-3/70 p-4 dark:bg-paper-2/40">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Why this is featured
              </span>
              <p className="m-0 text-sm leading-relaxed text-ink-soft">
                {profile.featuredReason}
              </p>
            </div>
          ) : null}

          {profile?.process?.length ? (
            <div className="grid gap-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Discovery process
              </span>
              <div className="grid gap-3">
                {profile.process.map((step, index) => (
                  <article
                    className="grid gap-1 rounded-none border border-line bg-paper-3/70 px-4 py-3 dark:bg-paper-2/40"
                    key={`${step.title}-${index}`}
                  >
                    <strong className="text-sm text-ink">
                      {index + 1}. {step.title}
                    </strong>
                    <p className="m-0 text-sm leading-relaxed text-ink-soft">{step.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {profile?.discoveryQueries && profile.discoveryQueries.length > 0 ? (
            <div className="grid gap-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Query hints
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.discoveryQueries.map((query) => (
                  <Badge color="indigo" key={query} size="sm">
                    {query}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {skill.upstreams && skill.upstreams.length > 0 ? (
            <div className="grid gap-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Trusted upstreams
              </span>
              <div className="grid gap-2">
                {skill.upstreams.map((upstream) => (
                  <a
                    className="grid gap-1 rounded-none border border-line bg-paper-3/70 px-4 py-3 no-underline transition-colors hover:bg-paper-3 dark:bg-paper-2/40"
                    href={upstream.upstreamUrl}
                    key={upstream.slug}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <strong className="text-sm text-ink">{upstream.title}</strong>
                    <p className="m-0 text-sm leading-relaxed text-ink-soft">{upstream.description}</p>
                    {upstream.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {upstream.tags.slice(0, 4).map((tag) => (
                          <Badge color="neutral" key={`${upstream.slug}-${tag}`} size="sm">
                            {formatTagLabel(tag)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </section>
  );
}
