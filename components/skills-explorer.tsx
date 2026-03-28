"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ArrowRightIcon, CubeStackIcon, SearchIcon, TimelineIcon } from "@/components/frontier-icons";
import { TrackSkillButton } from "@/components/track-skill-button";
import { formatDateTime } from "@/lib/format";
import type { CategoryDefinition, SearchHit, SkillRecord } from "@/lib/types";

type SkillsExplorerProps = {
  categories: CategoryDefinition[];
  skills: SkillRecord[];
};

const SEARCH_QUERY_KEY = "skillwire.explorer.query";
const SEARCH_FILTER_KEY = "skillwire.explorer.filter";

function toSearchHit(skill: SkillRecord, score: number): SearchHit {
  return {
    id: `skill:${skill.slug}:${skill.version}`,
    kind: "skill",
    title: skill.title,
    description: skill.description,
    href: skill.href,
    category: skill.category,
    tags: skill.tags,
    updatedAt: skill.updatedAt,
    origin: skill.origin,
    versionLabel: skill.versionLabel,
    score
  };
}

function filterSkills(skills: SkillRecord[], query: string, categoryFilter: string): SkillRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return skills
    .filter((skill) => (categoryFilter === "all" ? true : skill.category === categoryFilter))
    .filter((skill) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [skill.title, skill.description, skill.category, ...skill.tags].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function SkillsExplorer({ categories, skills }: SkillsExplorerProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [results, setResults] = useState<SearchHit[]>(
    filterSkills(skills, "", "all").map((skill, index) => toSearchHit(skill, skills.length - index))
  );
  const [isLoading, setIsLoading] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const skillMap = useMemo(() => new Map(skills.map((skill) => [skill.href, skill])), [skills]);
  const visibleResults = useMemo(
    () =>
      results
        .filter((result) => result.kind === "skill")
        .map((result) => skillMap.get(result.href) ?? null)
        .filter((skill): skill is SkillRecord => Boolean(skill)),
    [results, skillMap]
  );

  useEffect(() => {
    const savedQuery = window.localStorage.getItem(SEARCH_QUERY_KEY);
    const savedFilter = window.localStorage.getItem(SEARCH_FILTER_KEY);

    if (savedQuery) {
      setQuery(savedQuery);
    }
    if (savedFilter) {
      setCategoryFilter(savedFilter);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_QUERY_KEY, query);
  }, [query]);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_FILTER_KEY, categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const localMatches = filterSkills(skills, deferredQuery, categoryFilter);

    if (!normalizedQuery) {
      setResults(localMatches.map((skill, index) => toSearchHit(skill, localMatches.length - index)));
      setIsLoading(false);
      return () => controller.abort();
    }

    const params = new URLSearchParams({
      q: deferredQuery,
      kind: "skill",
      limit: String(Math.max(skills.length, 50))
    });

    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }

    setIsLoading(true);
    fetch(`/api/search?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((payload: { hits?: SearchHit[] }) => {
        setResults(payload.hits ?? []);
      })
      .catch(() => {
        setResults(localMatches.map((skill, index) => toSearchHit(skill, localMatches.length - index)));
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [categoryFilter, deferredQuery, normalizedQuery, skills]);

  return (
    <section className="catalog-shell">
      <div className="catalog-shell__head">
        <div>
          <span className="section-kicker">Find</span>
          <h2>Find the right skill</h2>
          <p className="section-copy">Then open setup or view it.</p>
        </div>
        <small>{skills.length} total</small>
      </div>

      <div className="catalog-toolbar">
        <label className="catalog-search">
          <SearchIcon className="catalog-search__icon" />
          <input
            className="search-field__input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, tag, or category"
            value={query}
          />
        </label>

        <div className="catalog-filters" role="tablist" aria-label="Skill categories">
          <button
            className={`filter-chip ${categoryFilter === "all" ? "filter-chip--active" : ""}`}
            onClick={() => setCategoryFilter("all")}
            type="button"
          >
            All
          </button>
          {categories.map((category) => (
            <button
              className={`filter-chip ${categoryFilter === category.slug ? "filter-chip--active" : ""}`}
              key={category.slug}
              onClick={() => setCategoryFilter(category.slug)}
              type="button"
            >
              {category.title}
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-meta">
        <strong>{visibleResults.length} matches</strong>
        <span>{isLoading ? "searching…" : normalizedQuery ? deferredQuery : "latest first"}</span>
      </div>

      <div className="catalog-skill-list">
        {visibleResults.length > 0 ? (
          visibleResults.map((skill) => {
            const sourceCount = skill.sources?.length ?? skill.references.length;
            const latestSummary = skill.updates?.[0]?.whatChanged ?? skill.updates?.[0]?.summary ?? skill.description;
            const statusLabel =
              skill.origin === "user"
                ? skill.automation?.enabled
                  ? `${skill.automation.cadence} ${skill.automation.status}`
                  : "manual"
                : skill.origin === "remote"
                  ? "imported"
                  : "catalog";

            return (
              <article className="catalog-skill-row" key={skill.href}>
                <div className="catalog-skill-row__main">
                  <div className="catalog-skill-row__title">
                    <span className="catalog-row__icon">
                      {skill.origin === "user" ? <TimelineIcon /> : <CubeStackIcon />}
                    </span>
                    <div>
                      <div className="catalog-skill-row__title-line">
                        <Link className="catalog-skill-row__link" href={skill.href}>
                          {skill.title}
                        </Link>
                        <span className="catalog-row__version">{skill.versionLabel}</span>
                      </div>
                      <div className="catalog-row__meta">
                        <span>{skill.category}</span>
                        <span>{statusLabel}</span>
                        <span>{sourceCount} sources</span>
                        <span>{skill.availableVersions.length} versions</span>
                        <span>{formatDateTime(skill.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="catalog-row__description">{latestSummary}</p>
                  <div className="catalog-row__tags">
                    {skill.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
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
                    <ArrowRightIcon />
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-card">No matches. Try another tag.</div>
        )}
      </div>
    </section>
  );
}
