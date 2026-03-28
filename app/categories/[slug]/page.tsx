import Link from "next/link";
import { notFound } from "next/navigation";

import { SearchIcon, TimelineIcon } from "@/components/frontier-icons";
import { SiteHeader } from "@/components/site-header";
import { TrackSkillButton } from "@/components/track-skill-button";
import { UsageBeacon } from "@/components/usage-beacon";
import { formatDateTime, getBrief, getCategory } from "@/lib/format";
import { getSkillwireSnapshot } from "@/lib/refresh";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const snapshot = await getSkillwireSnapshot();
  const category = getCategory(snapshot.categories, slug);
  if (!category) {
    notFound();
  }

  const brief = getBrief(snapshot.dailyBriefs, category.slug);
  const skills = snapshot.skills.filter((skill) => skill.category === category.slug);

  return (
    <>
      <UsageBeacon
        categorySlug={category.slug}
        dedupeKey={`page:/categories/${category.slug}`}
        kind="page_view"
        label="Opened category"
        path={`/categories/${category.slug}`}
      />
      <SiteHeader
        sections={[
          { href: "/", label: "Catalog" },
          { href: "/skills/new", label: "Add" },
          { href: "/admin", label: "Updates" },
          { href: `/categories/${category.slug}`, label: category.title }
        ]}
      />

      <main className="page-shell page-shell--narrow workspace-shell">
        <section className="workspace-hero workspace-hero--compact">
          <div className="workspace-hero__copy">
            <span className="section-kicker">{category.status}</span>
            <h1>{category.title}</h1>
            <p className="lede">{brief?.summary ?? category.hero}</p>
          </div>
          <div className="workspace-actions">
            <Link className="button" href="/skills/new">
              Add skill
            </Link>
            <Link className="button button--ghost" href="/admin#updates">
              Open updates
            </Link>
          </div>
        </section>

        <section className="surface-panel surface-panel--compact">
          <div className="inline-stats inline-stats--wide">
            <div>
              <small>skills</small>
              <strong>{skills.length}</strong>
            </div>
            <div>
              <small>sources</small>
              <strong>{category.sources.length}</strong>
            </div>
            <div>
              <small>brief items</small>
              <strong>{brief?.items.length ?? 0}</strong>
            </div>
            <div>
              <small>updated</small>
              <strong>{brief ? formatDateTime(brief.generatedAt) : "none"}</strong>
            </div>
          </div>
        </section>

        <section className="workspace-secondary">
          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Brief</span>
                <h2>Latest brief</h2>
              </div>
            </div>
            <div className="update-summary__copy">
              <p>{brief?.summary ?? "No category brief yet."}</p>
              {brief?.whatChanged ? <p>{brief.whatChanged}</p> : null}
            </div>
            <div className="detail-signal-list">
              {brief?.items.length ? (
                brief.items.map((item) => (
                  <a className="detail-signal-item" href={item.url} key={item.url} rel="noreferrer" target="_blank">
                    <strong>{item.title}</strong>
                    <span>
                      {item.source} · {formatDateTime(item.publishedAt)}
                    </span>
                  </a>
                ))
              ) : (
                <div className="empty-card">No brief items yet.</div>
              )}
            </div>
          </article>

          <article className="surface-panel surface-panel--compact">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Watchlist</span>
                <h2>Tracked sources</h2>
              </div>
            </div>
            <div className="simple-list simple-list--tight">
              {category.sources.map((source) => (
                <a className="simple-list__item simple-list__item--link" href={source.url} key={source.id} rel="noreferrer" target="_blank">
                  <div className="simple-list__icon">
                    <SearchIcon />
                  </div>
                  <div className="simple-list__body">
                    <div className="simple-list__row">
                      <strong>{source.label}</strong>
                      <span>{source.kind}</span>
                    </div>
                    <div className="simple-list__meta">
                      <span>{source.tags.join(" · ")}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </article>
        </section>

        <section className="surface-panel">
          <div className="surface-panel__head">
            <div>
              <span className="section-kicker">Skills</span>
              <h2>Skills in this lane</h2>
            </div>
          </div>
          <div className="catalog-skill-list">
            {skills.length > 0 ? (
              skills.map((skill) => (
                <article className="catalog-skill-row" key={skill.href}>
                  <div className="catalog-skill-row__main">
                    <div className="catalog-skill-row__title">
                      <span className="catalog-row__icon">
                        <TimelineIcon />
                      </span>
                      <div>
                        <div className="catalog-skill-row__title-line">
                          <Link className="catalog-skill-row__link" href={skill.href}>
                            {skill.title}
                          </Link>
                          <span className="catalog-row__version">{skill.versionLabel}</span>
                        </div>
                        <div className="catalog-row__meta">
                          <span>{skill.origin}</span>
                          <span>{skill.sources?.length ?? skill.references.length} sources</span>
                          <span>{formatDateTime(skill.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="catalog-row__description">{skill.updates?.[0]?.whatChanged ?? skill.description}</p>
                  </div>

                  <div className="catalog-skill-row__actions">
                    {skill.origin === "user" ? (
                      <Link className="button" href={skill.href}>
                        Open setup
                      </Link>
                    ) : (
                      <TrackSkillButton label="Set up skill" redirectTo="detail" slug={skill.slug} />
                    )}
                    <Link className="button button--ghost" href={skill.href}>
                      View
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-card">No skills in this lane yet.</div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
