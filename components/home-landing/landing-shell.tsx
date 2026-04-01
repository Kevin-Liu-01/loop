"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { motion } from "motion/react";

import { AutomationCalendar } from "@/components/automation-calendar";
import { ArrowRightIcon, AutomationIcon } from "@/components/frontier-icons";
import { GrainShader } from "@/components/home-landing/grain-shader";
import { HeroDiffField } from "@/components/home-landing/hero-diff-field";
import { LoopLogo } from "@/components/loop-logo";
import { SkillAuthorBadge } from "@/components/skill-author-badge";
import { SkillMetaBar } from "@/components/skill-meta-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { McpIcon, SkillIcon } from "@/components/ui/skill-icon";
import { StatusDot } from "@/components/ui/status-dot";
import { Tip } from "@/components/ui/tip";
import { computeFreshness, type FreshnessInfo } from "@/lib/freshness";
import { formatTagLabel, getTagColorForCategory, getTagColorForTransport } from "@/lib/tag-utils";
import type { AutomationSummary, CategorySlug, SkillRecord } from "@/lib/types";
import type {
  LandingSkillRow,
  LandingMcpRow,
} from "@/lib/home-landing/landing-data";

type NormalizedSkill = {
  slug: string;
  title: string;
  category: string;
  versionLabel: string;
  tone: "fresh" | "stale" | "idle";
  relativeTime: string;
  description: string;
  iconUrl?: string;
  ownerName: string;
  href: string;
};

function computeTone(iso: string): "fresh" | "stale" | "idle" {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 6) return "fresh";
  if (hours < 72) return "stale";
  return "idle";
}

function landingFreshness(skill: SkillRecord): FreshnessInfo {
  return computeFreshness(skill, []);
}

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function normalizeSkillRecord(s: SkillRecord): NormalizedSkill {
  return {
    slug: s.slug,
    title: s.title,
    category: s.category,
    versionLabel: s.versionLabel,
    tone: computeTone(s.updatedAt),
    relativeTime: relativeTime(s.updatedAt),
    description: s.description || s.excerpt,
    iconUrl: s.iconUrl ?? undefined,
    ownerName: s.ownerName ?? s.author?.displayName ?? "Loop",
    href: s.href,
  };
}

function normalizeStaticSkill(s: LandingSkillRow): NormalizedSkill {
  return {
    slug: s.slug,
    title: s.title,
    category: s.category,
    versionLabel: s.versionLabel,
    tone: s.tone,
    relativeTime: s.updatedAt,
    description: s.description,
    iconUrl: s.iconUrl,
    ownerName: s.ownerName,
    href: "/sign-up",
  };
}

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 as const },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const staggerWrap = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.1 as const },
  transition: { staggerChildren: 0.06, delayChildren: 0.05 },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

type LandingShellProps = {
  skills?: SkillRecord[];
  staticSkills?: LandingSkillRow[];
  mcps: LandingMcpRow[];
  automations: AutomationSummary[];
};

export function LandingShell({ skills, staticSkills, mcps, automations }: LandingShellProps) {
  const [brandHover, setBrandHover] = useState(false);

  const normalizedSkills: NormalizedSkill[] = skills
    ? skills.map(normalizeSkillRecord)
    : (staticSkills ?? []).map(normalizeStaticSkill);

  const skillMap = useMemo(() => {
    if (!skills) return undefined;
    const map = new Map<string, SkillRecord>();
    for (const s of skills) map.set(s.slug, s);
    return map;
  }, [skills]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <GrainShader />
          <div className="hero-fade absolute inset-0" />
        </div>

        {/* Nav */}
        <nav className="relative z-20 mx-auto flex max-w-[1100px] items-center justify-between px-6 pt-6">
          <Link
            className="flex items-center gap-2.5"
            href="/"
            onPointerEnter={() => setBrandHover(true)}
            onPointerLeave={() => setBrandHover(false)}
          >
            <LoopLogo
              className="h-7 w-7 text-accent"
              interactionActive={brandHover}
            />
            <strong className="font-serif text-[1.05rem] font-medium tracking-[-0.03em] text-ink/90">
              Loop
            </strong>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden h-9 items-center border border-ink/[0.08] bg-ink/[0.03] sm:flex">
              <Link
                className="inline-flex h-full items-center px-4 text-xs font-medium text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink/85"
                href="#skills"
              >
                Skills
              </Link>
              <span className="h-4 w-px bg-ink/[0.10]" />
              <Link
                className="inline-flex h-full items-center px-4 text-xs font-medium text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink/85"
                href="#mcps"
              >
                Automations
              </Link>
            </div>
            <ThemeToggle className="size-9 border-ink/[0.08] bg-transparent text-ink/45 hover:border-ink/[0.14] hover:bg-ink/[0.06] hover:text-ink/85 rounded-none" />
            <Link
              className="hidden h-9 items-center px-3 text-xs font-medium text-ink/50 transition-colors hover:text-ink/85 sm:inline-flex"
              href="/sign-in"
            >
              Sign in
            </Link>
            <LinkButton href="/sign-up" size="sm" variant="primary">
              Get started
            </LinkButton>
          </div>
        </nav>

        {/* Hero — centered stack */}
        <div className="relative z-10 mx-auto max-w-[1100px] px-6 pb-16 pt-[min(14vh,120px)] text-center">
          <motion.div className="mx-auto grid max-w-[700px] gap-7" {...fadeUp}>
            <div className="grid gap-5">
              <h1 className="font-serif text-[clamp(2.8rem,5.8vw,4.8rem)] font-medium leading-[1.02] tracking-[-0.045em] text-ink">
                Skills that{"\u00A0"}never
                <br className="max-sm:hidden" />
                {" "}go{"\u00A0"}stale
              </h1>

              <p className="mx-auto max-w-[34rem] text-balance text-[1.1rem] leading-[1.7] text-ink/55">
                Loop autonomously monitors, evaluates, and updates your agent
                playbooks, so every skill evolves on its own.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <LinkButton href="/sign-up" variant="primary">
                Get started free
              </LinkButton>
              <LinkButton href="#skills" variant="ghost">
                Browse skills
              </LinkButton>
            </div>
          </motion.div>

          {/* Proof strip */}
          {/* 
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.72rem] font-medium tabular-nums text-white/25"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <span>142+ skills tracked</span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span>2,400+ updates shipped</span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span>23 MCP providers</span>
          </motion.div>
          */}
        </div>

        {/* 3D diff card field */}
        <div className="relative z-10 px-6 pb-16">
          <HeroDiffField />
        </div>

        <div className="relative z-10 mx-auto max-w-[1100px] px-6">
          <div className="h-px w-full bg-line" />
        </div>
      </section>

      {/* ── LIVE SKILLS ── */}
      <section className="relative z-10" id="skills">
        <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-14">
          <motion.div className="mb-8 grid gap-2" {...fadeUp}>
            <h2 className="font-serif text-[clamp(1.4rem,2.6vw,2rem)] font-medium leading-[1.12] tracking-[-0.03em]">
              Every skill, always current
            </h2>
          </motion.div>

          <motion.div className="grid gap-0" {...staggerWrap}>
            {skills
              ? skills.map((skill) => {
                  const freshness = landingFreshness(skill);
                  return (
                    <motion.article
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 max-sm:grid-cols-1"
                      key={skill.slug}
                      {...staggerItem}
                    >
                      <a className="group min-w-0" href={skill.href}>
                        <div className="flex items-start gap-2.5">
                          <SkillIcon className="mt-0.5 rounded-md" iconUrl={skill.iconUrl} size={28} slug={skill.slug} />
                          <div className="min-w-0 grid flex-1 gap-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <Tip content={freshness.tone === "fresh" ? "Recently updated" : freshness.tone === "stale" ? "Hasn't changed recently" : "Unknown freshness"} side="top">
                                <span className="inline-flex items-center"><StatusDot tone={freshness.tone} /></span>
                              </Tip>
                              <span className="truncate font-serif text-[0.94rem] font-medium text-ink group-hover:text-ink-soft">
                                {skill.title}
                              </span>
                              <Badge color={getTagColorForCategory(skill.category)} size="sm">{formatTagLabel(skill.category)}</Badge>
                              <Badge color="neutral" size="sm">{skill.versionLabel}</Badge>
                            </div>
                            <p className="m-0 line-clamp-1 text-sm text-ink-soft">{skill.description}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink-faint">
                              <SkillAuthorBadge author={skill.author} compact linked={false} ownerName={skill.ownerName} iconUrl={skill.iconUrl} />
                              <SkillMetaBar freshness={freshness} skill={skill} />
                            </div>
                          </div>
                        </div>
                      </a>
                      <div className="flex items-center gap-1.5 max-sm:pl-4">
                        {skill.automation?.enabled && (
                          <Tip content="Automation active" side="top">
                            <span className="flex h-7 w-7 items-center justify-center text-ink-faint">
                              <AutomationIcon className="h-3.5 w-3.5" />
                            </span>
                          </Tip>
                        )}
                        <LinkButton href={skill.href} size="sm" variant="ghost">
                          Open
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </LinkButton>
                      </div>
                    </motion.article>
                  );
                })
              : normalizedSkills.map((skill) => (
                  <motion.article
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-3.5 first:border-t-0 first:pt-0 max-sm:grid-cols-1"
                    key={skill.slug}
                    {...staggerItem}
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <SkillIcon className="rounded-md" iconUrl={skill.iconUrl} size={24} slug={skill.slug} />
                        <StatusDot tone={skill.tone} />
                        <span className="truncate font-serif text-[0.94rem] font-medium text-ink">
                          {skill.title}
                        </span>
                        <Badge color={getTagColorForCategory(skill.category as CategorySlug)} size="sm">
                          {formatTagLabel(skill.category)}
                        </Badge>
                        <Badge color="neutral" size="sm">{skill.versionLabel}</Badge>
                      </div>
                      <p className="m-0 mt-1 line-clamp-1 text-sm text-ink-soft">
                        {skill.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-faint">
                        <span>{skill.ownerName}</span>
                        <span>·</span>
                        <span className="tabular-nums">{skill.relativeTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 max-sm:pl-0">
                      <LinkButton href={skill.href} size="sm" variant="ghost">
                        Open
                      </LinkButton>
                    </div>
                  </motion.article>
                ))}
          </motion.div>

          <motion.div className="mt-6" {...fadeUp}>
            <LinkButton href="/sign-up" variant="ghost">
              See all skills
            </LinkButton>
          </motion.div>
        </div>

        <div className="mx-auto max-w-[1100px] px-6">
          <div className="h-px w-full bg-line" />
        </div>
      </section>

      {/* ── AUTOMATION CALENDAR + MCP GRID ── */}
      <section className="relative z-10" id="mcps">
        <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-14">
          <motion.div
            className="grid gap-10 lg:grid-cols-2 lg:gap-0"
            {...staggerWrap}
          >
            {/* Left: Calendar */}
            <motion.div className="lg:border-r lg:border-line lg:pr-8" {...staggerItem}>
              <div className="mb-6 grid gap-2">
                <h2 className="font-serif text-[clamp(1.3rem,2.2vw,1.7rem)] font-medium leading-[1.12] tracking-[-0.03em]">
                  Scheduled intelligence
                </h2>
                <p className="max-w-[26rem] text-sm leading-[1.65] text-ink-soft">
                  Every dot is an automated agent run — skills refresh themselves on a schedule you control.
                </p>
              </div>
              <AutomationCalendar automations={automations} maxLegendRows={5} skillMap={skillMap} variant="sidebar" />
            </motion.div>

            {/* Right: MCP list */}
            <motion.div className="lg:pl-8" {...staggerItem}>
              <div className="mb-6 grid gap-2">
                <h2 className="font-serif text-[clamp(1.3rem,2.2vw,1.7rem)] font-medium leading-[1.12] tracking-[-0.03em]">
                  Connect any tool
                </h2>
                <p className="max-w-[26rem] text-sm leading-[1.65] text-ink-soft">
                  Import from the open MCP ecosystem — Loop versions everything alongside your skills.
                </p>
              </div>
              <div className="grid gap-1.5">
                {mcps.map((mcp) => (
                  <div
                    className="group flex items-start gap-3 border border-line bg-paper-2/50 p-3 transition-colors hover:border-accent/25 hover:bg-paper-2"
                    key={mcp.id}
                  >
                    <McpIcon
                      className="mt-0.5 shrink-0 rounded-md"
                      iconUrl={mcp.iconUrl}
                      name={mcp.name}
                      size={28}
                    />
                    <div className="min-w-0 flex-1 grid gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">
                          {mcp.name}
                        </span>
                        <Badge color={getTagColorForTransport(mcp.transport)} size="sm">
                          {mcp.transport}
                        </Badge>
                      </div>
                      <p className="m-0 truncate text-xs text-ink-faint">
                        {mcp.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="mx-auto max-w-[1100px] px-6">
          <div className="h-px w-full bg-line" />
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-[680px] place-items-center gap-6 px-6 pb-20 pt-16 text-center">
          <motion.div className="grid gap-4" {...fadeUp}>
            <LoopLogo className="mx-auto h-10 w-10 text-accent" />
            <h2 className="font-serif text-[clamp(1.4rem,2.4vw,2rem)] font-medium tracking-[-0.03em]">
              Start keeping skills fresh
            </h2>
            <p className="mx-auto max-w-[30rem] text-[0.95rem] leading-[1.7] text-ink-soft">
              Set up in minutes. Connect your repos, import skills and MCP
              servers, and let Loop handle the rest.
            </p>
          </motion.div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/sign-up" variant="primary">
              Get started free
            </LinkButton>
            <LinkButton href="/sign-in" variant="ghost">
              Sign in
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="h-px w-full bg-line" />
      </div>
      <footer className="relative z-10 px-6 py-6">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[0.62rem] tabular-nums text-ink-faint">
            © {new Date().getFullYear()} Loop · Operator desk for agent skills
          </p>
          <nav className="flex items-center gap-6 text-[0.62rem]">
            <Link className="text-ink-faint transition-colors hover:text-ink" href="/sign-up">Get started</Link>
            <Link className="text-ink-faint transition-colors hover:text-ink" href="#skills">Skills</Link>
            <Link className="text-ink-faint transition-colors hover:text-ink" href="#mcps">MCPs</Link>
            <Link className="text-ink-faint transition-colors hover:text-ink" href="/sign-in">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
