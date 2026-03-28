"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { CopyButton } from "@/components/copy-button";
import {
  CubeStackIcon,
  FlowIcon,
  PulseIcon,
  RadarIcon,
  SearchIcon,
  SparkIcon,
  TimelineIcon,
  WalletIcon
} from "@/components/frontier-icons";
import { SignalCoreScene } from "@/components/signal-core-scene";
import { SkillsExplorer } from "@/components/skills-explorer";
import { SkillChat } from "@/components/skill-chat";
import { formatDate } from "@/lib/format";
import type {
  AutomationSummary,
  CategoryBrief,
  CategoryDefinition,
  MembershipPlan,
  RefreshRunRecord,
  SkillRecord
} from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

type FrontierHomeShellProps = {
  categories: CategoryDefinition[];
  featuredSkills: SkillRecord[];
  communitySkills: SkillRecord[];
  allSkills: SkillRecord[];
  leadBrief: CategoryBrief | null;
  latestAutomations: AutomationSummary[];
  plans: MembershipPlan[];
  latestRun: RefreshRunRecord | null;
  chatEnabled: boolean;
  logoSvg: string;
  metrics: {
    skillCount: number;
    automationCount: number;
    dailyLaneCount: number;
    remoteSkillCount: number;
    versionedSkillCount: number;
    searchDocumentCount: number;
  };
};

const capabilityCards = [
  {
    title: "Live skill revisions",
    copy: "Each refresh writes a fresh version trail, so the desk evolves without torching provenance.",
    icon: TimelineIcon
  },
  {
    title: "Executable MCP tools",
    copy: "Imported stdio and http MCPs can run as real tools instead of decorative registry wallpaper.",
    icon: FlowIcon
  },
  {
    title: "Observable control tower",
    copy: "Refresh health, index coverage, and billing posture sit in the same operating picture.",
    icon: PulseIcon
  }
] as const;

export function FrontierHomeShell({
  categories,
  featuredSkills,
  communitySkills,
  allSkills,
  leadBrief,
  latestAutomations,
  plans,
  latestRun,
  chatEnabled,
  logoSvg,
  metrics
}: FrontierHomeShellProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-frontier-hero-copy]",
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }
      );

      gsap.fromTo(
        "[data-frontier-hero-scene]",
        { opacity: 0, y: 32, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power3.out", delay: 0.12 }
      );

      gsap.utils.toArray<HTMLElement>("[data-frontier-reveal]").forEach((element, index) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 54 },
          {
            opacity: 1,
            y: 0,
            duration: 0.88,
            ease: "power3.out",
            delay: index * 0.035,
            scrollTrigger: {
              trigger: element,
              start: "top 82%"
            }
          }
        );
      });

      gsap.to("[data-frontier-parallax='slow']", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.1
        }
      });

      gsap.to("[data-frontier-parallax='fast']", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8
        }
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main className="frontier-shell" ref={rootRef}>
      <section className="frontier-hero">
        <div className="frontier-hero__copy card" data-frontier-hero-copy>
          <span className="eyebrow-pill">
            <RadarIcon className="frontier-inline-icon" />
            Self-adapting operator desk
          </span>
          <h1 className="frontier-title">
            Signal-first loops.
            <br />
            High-tech surface.
            <br />
            Real runtime.
          </h1>
          <p className="frontier-subcopy">
            Loop packages self-updating loops, search, agents, runtime connectors, billing, and refresh telemetry into
            one product shell. It feels like a landing page and behaves like an operating console.
          </p>

          <div className="frontier-actions">
            <Link className="button" href="/agents">
              Run the agent lab
            </Link>
            <Link className="button button--ghost" href="/admin">
              Open control tower
            </Link>
            <Link className="button button--ghost" href="/skills/new">
              Publish a skill
            </Link>
            <CopyButton label="Copy RSS path" value="/feed.xml" />
            <CopyButton label="Copy SVG logo" value={logoSvg} />
          </div>

          <div className="frontier-metric-row">
            <article className="frontier-metric" data-frontier-parallax="slow">
              <small>skills</small>
              <strong>{metrics.skillCount}</strong>
            </article>
            <article className="frontier-metric" data-frontier-parallax="fast">
              <small>versions</small>
              <strong>{metrics.versionedSkillCount}</strong>
            </article>
            <article className="frontier-metric" data-frontier-parallax="slow">
              <small>search docs</small>
              <strong>{metrics.searchDocumentCount}</strong>
            </article>
            <article className="frontier-metric" data-frontier-parallax="fast">
              <small>imports</small>
              <strong>{metrics.remoteSkillCount}</strong>
            </article>
          </div>
        </div>

        <div className="frontier-hero__scene card" data-frontier-hero-scene>
          <SignalCoreScene
            automationCount={metrics.automationCount}
            indexCount={metrics.searchDocumentCount}
            skillCount={metrics.skillCount}
          />
          <div className="frontier-runbar">
            <div>
              <span>Latest refresh</span>
              <strong>{latestRun ? latestRun.status : "no runs yet"}</strong>
            </div>
            <div>
              <span>Snapshot</span>
              <strong>{latestRun?.generatedAt ? formatDate(latestRun.generatedAt) : "waiting"}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{latestRun?.generatedFrom ?? "local-scan"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="frontier-proof-grid" data-frontier-reveal>
        {capabilityCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="frontier-proof-card card" key={card.title}>
              <span className="frontier-proof-card__icon">
                <Icon />
              </span>
              <h2>{card.title}</h2>
              <p>{card.copy}</p>
            </article>
          );
        })}
      </section>

      <section className="frontier-section" data-frontier-reveal>
        <div className="frontier-section__head">
          <div>
            <span className="eyebrow-pill">
              <PulseIcon className="frontier-inline-icon" />
              Observability
            </span>
            <h2>One landing page. One operator-grade board.</h2>
          </div>
          <small>Not decorative telemetry. Actual system posture.</small>
        </div>

        <div className="frontier-observability-grid">
          <article className="frontier-ob-card card">
            <div className="frontier-ob-card__head">
              <span className="frontier-ob-card__icon">
                <PulseIcon />
              </span>
              <div>
                <strong>Refresh control</strong>
                <small>
                  {latestRun?.status === "success"
                    ? "Latest run finished cleanly."
                    : latestRun?.errorMessage ?? "Waiting for the next run."}
                </small>
              </div>
            </div>
            <div className="frontier-ob-card__meter">
              <span />
              <span />
              <span />
            </div>
            <div className="frontier-stat-list">
              <div>
                <span>daily lanes</span>
                <strong>{metrics.dailyLaneCount}</strong>
              </div>
              <div>
                <span>automations</span>
                <strong>{metrics.automationCount}</strong>
              </div>
              <div>
                <span>imports</span>
                <strong>{metrics.remoteSkillCount}</strong>
              </div>
            </div>
          </article>

          <article className="frontier-ob-card card">
            <div className="frontier-ob-card__head">
              <span className="frontier-ob-card__icon">
                <SearchIcon />
              </span>
              <div>
                <strong>Search index</strong>
                <small>Persisted, fast, and scoped to your catalog.</small>
              </div>
            </div>
            <div className="frontier-ob-card__list">
              <div>
                <span>indexed docs</span>
                <strong>{metrics.searchDocumentCount}</strong>
              </div>
              <div>
                <span>versioned skills</span>
                <strong>{metrics.versionedSkillCount}</strong>
              </div>
              <div>
                <span>category lanes</span>
                <strong>{metrics.dailyLaneCount}</strong>
              </div>
            </div>
          </article>

          <article className="frontier-ob-card card">
            <div className="frontier-ob-card__head">
              <span className="frontier-ob-card__icon">
                <WalletIcon />
              </span>
              <div>
                <strong>Commercial layer</strong>
                <small>Memberships, checkout, portal, and event logging are wired in.</small>
              </div>
            </div>
            <div className="frontier-plan-stack">
              {plans.map((plan) => (
                <div className="frontier-plan-row" key={plan.slug}>
                  <span>{plan.title}</span>
                  <strong>{plan.priceLabel}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="frontier-section" data-frontier-reveal>
        <div className="frontier-section__head">
          <div>
            <span className="eyebrow-pill">
              <SearchIcon className="frontier-inline-icon" />
              Search and discovery
            </span>
            <h2>Move like an operator, not a tourist.</h2>
          </div>
          <small>Command-K energy, without the fake speed claims.</small>
        </div>
        <SkillsExplorer categories={categories} skills={allSkills} />
      </section>

      <section className="frontier-section frontier-section--split" data-frontier-reveal>
        <div className="frontier-panel card">
          <div className="frontier-section__head frontier-section__head--tight">
            <div>
              <span className="eyebrow-pill">
                <CubeStackIcon className="frontier-inline-icon" />
                Lanes
              </span>
              <h2>Daily categories with actual signal.</h2>
            </div>
          </div>
          <div className="frontier-lane-grid">
            {categories.map((category) => (
              <Link className="frontier-lane-card" href={`/categories/${category.slug}`} key={category.slug}>
                <div>
                  <strong>{category.title}</strong>
                  <span>{category.status}</span>
                </div>
                <p>{category.strapline}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="frontier-panel card">
          <div className="frontier-section__head frontier-section__head--tight">
            <div>
              <span className="eyebrow-pill">
                <SparkIcon className="frontier-inline-icon" />
                Lead brief
              </span>
              <h2>{leadBrief?.title ?? "Signal warming up"}</h2>
            </div>
          </div>
          <p className="frontier-panel__copy">
            {leadBrief?.summary ?? "Run the refresh route once and the front page will stop talking in hypotheticals."}
          </p>
          <div className="frontier-brief-feed">
            {leadBrief?.items?.slice(0, 4).map((item) => (
              <a className="frontier-brief-item" href={item.url} key={item.url} rel="noreferrer" target="_blank">
                <strong>{item.title}</strong>
                <span>
                  {item.source} · {formatDate(item.publishedAt)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="frontier-section frontier-section--split" data-frontier-reveal>
        <div className="frontier-panel card">
          <div className="frontier-section__head frontier-section__head--tight">
            <div>
              <span className="eyebrow-pill">
                <FlowIcon className="frontier-inline-icon" />
                Featured skill graph
              </span>
              <h2>Canonical prompts with clean version trails.</h2>
            </div>
          </div>
          <div className="frontier-skill-grid">
            {featuredSkills.map((skill) => (
              <Link className="frontier-skill-card" href={skill.href} key={skill.slug}>
                <div className="frontier-skill-card__meta">
                  <span>{skill.category}</span>
                  <small>{skill.versionLabel}</small>
                </div>
                <strong>{skill.title}</strong>
                <p>{skill.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="frontier-panel card">
          <div className="frontier-section__head frontier-section__head--tight">
            <div>
              <span className="eyebrow-pill">
                <RadarIcon className="frontier-inline-icon" />
                Community lanes
              </span>
              <h2>Living skills from real operators.</h2>
            </div>
          </div>
          <div className="frontier-community-list">
            {communitySkills.length > 0 ? (
              communitySkills.map((skill) => (
                <Link className="frontier-community-item" href={skill.href} key={skill.slug}>
                  <div>
                    <strong>{skill.title}</strong>
                    <span>{skill.ownerName ?? "Community"}</span>
                  </div>
                  <small>{skill.sources?.length ?? 0} tracked sources</small>
                </Link>
              ))
            ) : (
              <div className="frontier-community-empty">
                No public community skills yet. Publish the first one and let the desk earn its electricity bill.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="frontier-section frontier-section--split" data-frontier-reveal>
        <div className="frontier-panel card">
          <div className="frontier-section__head frontier-section__head--tight">
            <div>
              <span className="eyebrow-pill">
                <TimelineIcon className="frontier-inline-icon" />
                Automation tape
              </span>
              <h2>Operational movement in plain sight.</h2>
            </div>
          </div>
          <div className="frontier-timeline-list">
            {latestAutomations.length > 0 ? (
              latestAutomations.map((automation) => (
                <div className="frontier-timeline-item" key={automation.id}>
                  <span />
                  <div>
                    <strong>{automation.name}</strong>
                    <small>{automation.schedule || "manual"}</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="frontier-community-empty">
                No indexed automation yet. The tape will fill as local Codex flows and skill refresh jobs are picked up.
              </div>
            )}
          </div>
        </div>

        <SkillChat
          enabled={chatEnabled}
          starterPrompt="Explain the current system health, search coverage, and which attached skill I should use next."
        />
      </section>
    </main>
  );
}
