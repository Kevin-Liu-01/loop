"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { LoopLogo } from "@/components/loop-logo";
import { LandingSkillCardEl } from "@/components/home-landing/landing-skill-card";
import { LandingPipeline } from "@/components/home-landing/landing-pipeline";
import { LandingTomlViewer } from "@/components/home-landing/landing-toml-viewer";
import { DiffLoopCanvas } from "@/components/home-landing/diff-loop-canvas";
import {
  LANDING_SKILLS,
  LANDING_TIMELINE,
  LANDING_MCP_SERVERS,
  LANDING_MCP_CAPABILITIES,
} from "@/lib/home-landing/landing-data";
import { LANDING_PALETTE } from "@/lib/home-landing/constants";
import { useLandingParallax } from "@/components/home-landing/use-landing-parallax";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 as const },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const staggerChildren = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { staggerChildren: 0.08, delayChildren: 0.1 },
};

const staggerChild = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[#e8650a]/45">
      <span className="h-px w-5 bg-[#e8650a]/20" />
      {children}
    </span>
  );
}

function SectionDivider() {
  return (
    <div className="relative">
      <div className="h-px w-full bg-white/[0.04]" />
      <div className="absolute inset-x-0 top-0 mx-auto h-px w-[min(280px,50%)] bg-gradient-to-r from-transparent via-[#e8650a]/12 to-transparent" />
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-3">
      <span className="font-serif text-xl font-medium tabular-nums text-white/85">{value}</span>
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white/22">{label}</span>
    </div>
  );
}

function ActionCard({ title, description, href, linkText }: {
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <Link
      href={href}
      className="group grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#e8650a]/20 hover:bg-white/[0.03]"
    >
      <span className="text-[0.95rem] font-semibold text-white/80 transition-colors group-hover:text-white">
        {title}
      </span>
      <span className="text-[0.82rem] leading-[1.6] text-white/30">
        {description}
      </span>
      <span className="font-mono text-[0.68rem] font-medium text-[#e8650a]/70 transition-colors group-hover:text-[#e8650a]">
        {linkText} →
      </span>
    </Link>
  );
}

export function LandingShell() {
  const [brandHover, setBrandHover] = useState(false);
  const parallaxRootRef = useRef<HTMLDivElement>(null);
  useLandingParallax(parallaxRootRef);

  return (
    <div
      ref={parallaxRootRef}
      className="relative min-h-screen overflow-x-hidden text-white"
      style={{ backgroundColor: LANDING_PALETTE.bg }}
    >
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[100dvh] w-full overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,101,10,0.08),transparent_70%)]"
        />

        {/* Nav */}
        <nav className="relative z-20 mx-auto flex max-w-[1100px] items-center justify-between px-6 pt-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onPointerEnter={() => setBrandHover(true)}
            onPointerLeave={() => setBrandHover(false)}
          >
            <LoopLogo
              className="h-7 w-7 text-[#e8650a]"
              chipClassName="fill-white"
              interactionActive={brandHover}
            />
            <span className="font-serif text-[1.05rem] font-medium tracking-[-0.03em] text-white/90">
              Loop
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="#skills"
              className="text-sm text-white/30 transition-colors hover:text-white/60 max-sm:hidden"
            >
              Skills
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-white/30 transition-colors hover:text-white/60 max-sm:hidden"
            >
              How it works
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-[#e8650a] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(232,101,10,0.2)] transition-all hover:bg-[#ff7a1a] hover:shadow-[0_0_28px_rgba(232,101,10,0.35)]"
            >
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero copy */}
        <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-[1100px] content-center gap-10 px-6 pb-24 pt-10">
          <motion.div className="mx-auto grid max-w-[52rem] gap-8 text-center" {...fadeUp}>
            <div className="grid gap-5">
              <SectionLabel>Operator desk for agent skills</SectionLabel>
              <h1 className="text-balance font-serif text-[clamp(2.6rem,5vw,4.2rem)] font-medium leading-[1.04] tracking-[-0.04em] text-white">
                Skills that{"\u00A0"}never
                <br className="max-sm:hidden" />
                {" "}go{"\u00A0"}stale
              </h1>
              <p className="mx-auto max-w-[38rem] text-balance text-[1.08rem] leading-[1.7] text-white/38">
                Loop continuously monitors, evaluates, and updates your agent
                playbooks — so every skill evolves on its own. Connect any MCP
                server, tune models, wire tools: reviewable diffs, eval-gated.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-[#e8650a] px-7 py-3 text-[0.92rem] font-semibold text-white shadow-[0_0_24px_rgba(232,101,10,0.28)] transition-all hover:bg-[#ff7a1a] hover:shadow-[0_0_36px_rgba(232,101,10,0.4)]"
              >
                Get started free
              </Link>
              <Link
                href="#skills"
                className="rounded-full border border-white/[0.08] px-6 py-3 text-[0.92rem] font-medium text-white/45 transition-colors hover:border-[#e8650a]/25 hover:text-white/75"
              >
                Browse skills
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-full border border-white/[0.08] px-6 py-3 text-[0.92rem] font-medium text-white/45 transition-colors hover:border-white/15 hover:text-white/75"
              >
                How it works
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <StatPill value="40+" label="curated skills" />
              <StatPill value="< 6h" label="update cycle" />
              <StatPill value="4" label="agent platforms" />
              <StatPill value="35+" label="MCP servers" />
            </div>
          </motion.div>

          {/* Quick action cards */}
          <motion.div
            className="mx-auto grid max-w-[52rem] grid-cols-1 gap-3 sm:grid-cols-3"
            {...staggerChildren}
          >
            <motion.div {...staggerChild}>
              <ActionCard
                title="Browse the catalog"
                description="40+ curated skills for frontend, SEO, security, agents, and more."
                href="/sign-up"
                linkText="Explore skills"
              />
            </motion.div>
            <motion.div {...staggerChild}>
              <ActionCard
                title="Create a skill"
                description="Build custom skills with agent docs for Cursor, Codex, Claude, and AGENTS.md."
                href="/sign-up"
                linkText="Start creating"
              />
            </motion.div>
            <motion.div {...staggerChild}>
              <ActionCard
                title="Connect MCP servers"
                description="Import server definitions from the open ecosystem and wire them in."
                href="/sign-up"
                linkText="Discover MCPs"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ LIVE DIFF ═══ */}
      <SectionDivider />
      <section className="relative z-10 bg-[#08080a]">
        <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-20">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
            <motion.div className="grid content-center gap-5" {...fadeUp}>
              <SectionLabel>Live diff preview</SectionLabel>
              <h2 className="font-serif text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.03em] text-white">
                Watch skills evolve<br className="max-sm:hidden" /> in real time
              </h2>
              <p className="max-w-[32rem] text-[0.95rem] leading-[1.7] text-white/35">
                Every update is a clean, reviewable diff. Model swaps light up orange,
                removed lines fade — you see exactly what changed and why.
                Loop cycles through versions automatically.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {["v2 → v3", "v3 → v4", "v4 → v5"].map((v) => (
                  <span
                    key={v}
                    className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-1.5 font-mono text-[0.62rem] tabular-nums text-white/28"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="flex justify-center"
              data-parallax="0.06"
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.12 }}
            >
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-8 rounded-3xl bg-[#e8650a]/[0.03] blur-2xl"
                />
                <DiffLoopCanvas className="relative rounded-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ SKILLS SHOWCASE ═══ */}
      <SectionDivider />
      <section id="skills" className="relative z-10 bg-[#07070a]">
        <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-20">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <motion.div className="grid content-start gap-6" {...fadeUp}>
              <div className="grid gap-4">
                <SectionLabel>Live skill catalog</SectionLabel>
                <h2 className="font-serif text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.03em] text-white">
                  Every skill,<br className="max-sm:hidden" /> always{"\u00A0"}current
                </h2>
                <p className="max-w-[32rem] text-[0.95rem] leading-[1.7] text-white/35">
                  Your catalog shows freshness at a glance — status dots, version
                  badges, timeline history. Click any card to see how Loop evolved it.
                </p>
              </div>

              <div className="grid gap-2.5">
                {LANDING_SKILLS.map((skill, i) => (
                  <LandingSkillCardEl
                    key={skill.slug}
                    skill={skill}
                    timeline={skill.slug === "reasoning-agent" ? LANDING_TIMELINE : undefined}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid content-start gap-6"
              data-parallax="0.07"
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.12 }}
            >
              <div className="grid gap-4">
                <SectionLabel>Skill file</SectionLabel>
                <p className="max-w-[30rem] text-[0.88rem] leading-[1.65] text-white/30">
                  Each skill is a versioned TOML file — model config, tools, guardrails, eval
                  criteria. Switch to the diff tab to see what Loop changed.
                </p>
              </div>
              <LandingTomlViewer />

              <div className="grid grid-cols-3 gap-3">
                {[
                  { dot: "bg-emerald-500/55", text: "4 versions" },
                  { dot: "bg-[#e8650a]/55", text: "auto · 6h cycle" },
                  { dot: "bg-sky-400/45", text: "3 sources watched" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5"
                  >
                    <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${item.dot}`} />
                    <span className="font-mono text-[0.6rem] text-white/30">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ MCP INTEGRATION ═══ */}
      <SectionDivider />
      <section className="relative z-10 bg-[#08080a]">
        <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-20">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
            <motion.div className="grid content-start gap-6" {...fadeUp}>
              <div className="grid gap-4">
                <SectionLabel>MCP integration</SectionLabel>
                <h2 className="font-serif text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.03em] text-white">
                  Connect any{"\u00A0"}MCP{"\u00A0"}server
                </h2>
                <p className="max-w-[32rem] text-[0.95rem] leading-[1.7] text-white/35">
                  Import server definitions from the open ecosystem. Loop discovers
                  tools, executes them at runtime, and versions everything alongside
                  your skills — so agents stay wired to the services they need.
                </p>
              </div>

              <div className="grid gap-3">
                {LANDING_MCP_CAPABILITIES.map((cap) => (
                  <div
                    key={cap.label}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-3"
                  >
                    <span className="mt-[3px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#e8650a]/55" />
                    <div className="grid gap-0.5">
                      <span className="text-[0.88rem] font-medium text-white/65">{cap.label}</span>
                      <span className="font-mono text-[0.62rem] text-white/22">{cap.mono}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid content-start gap-4"
              data-parallax="0.06"
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.12 }}
            >
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500/50" />
                  <span className="font-mono text-[0.65rem] font-medium text-white/40">MCP registry</span>
                  <span className="flex-1" />
                  <span className="font-mono text-[0.55rem] tabular-nums text-white/20">
                    {LANDING_MCP_SERVERS.length} servers · stdio + http
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/[0.03] sm:grid-cols-3">
                  {LANDING_MCP_SERVERS.map((server) => (
                    <div
                      key={server.name}
                      className="group flex items-center gap-3 bg-[#08080a] px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate text-[0.84rem] font-medium text-white/60 transition-colors group-hover:text-white/85">
                          {server.name}
                        </span>
                        <span className="font-mono text-[0.58rem] text-white/18">{server.transport}</span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { dot: "bg-[#e8650a]/55", text: "35+ servers" },
                  { dot: "bg-emerald-500/55", text: "import from URL" },
                  { dot: "bg-sky-400/45", text: "open protocol" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5"
                  >
                    <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${item.dot}`} />
                    <span className="font-mono text-[0.6rem] text-white/30">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <SectionDivider />
      <section
        id="how-it-works"
        className="relative z-10 bg-[#07070a]"
      >
        <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-20">
          <motion.div className="grid gap-4 pb-12" {...fadeUp}>
            <SectionLabel>How it works</SectionLabel>
            <h2 className="font-serif text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium leading-[1.12] tracking-[-0.03em] text-white">
              Monitor → Evaluate → Deploy
            </h2>
            <p className="max-w-[40rem] text-[0.95rem] leading-[1.7] text-white/35">
              A three-phase loop that keeps every skill sharp. Click each step to
              see what happens under the hood.
            </p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
            <div className="rounded-3xl border border-white/[0.04] bg-white/[0.012] p-6 lg:p-10">
              <LandingPipeline />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <SectionDivider />
      <section className="relative z-10 bg-[#08080a]">
        <div className="mx-auto grid max-w-[680px] place-items-center gap-8 px-6 pb-28 pt-24 text-center">
          <motion.div className="grid gap-5" {...fadeUp}>
            <div className="relative mx-auto">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-4 rounded-full bg-[#e8650a]/[0.08] blur-xl"
              />
              <LoopLogo className="relative h-12 w-12 text-[#e8650a]" chipClassName="fill-white" />
            </div>
            <h2 className="font-serif text-[clamp(1.4rem,2.4vw,2rem)] font-medium tracking-[-0.03em] text-white">
              Start keeping skills fresh
            </h2>
            <p className="mx-auto max-w-[30rem] text-[0.95rem] leading-[1.7] text-white/35">
              Set up in minutes. Connect your repos, import skills and MCP servers,
              and let Loop handle the rest.
            </p>
          </motion.div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-[#e8650a] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(232,101,10,0.28)] transition-all hover:bg-[#ff7a1a] hover:shadow-[0_0_36px_rgba(232,101,10,0.4)]"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-white/[0.08] px-5 py-2.5 text-sm font-medium text-white/45 transition-colors hover:border-white/15 hover:text-white/75"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <SectionDivider />
      <footer className="relative z-10 bg-[#08080a] px-6 py-6">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          <p className="m-0 font-mono text-[0.62rem] tabular-nums text-white/18">
            © {new Date().getFullYear()} Loop · Operator desk for agent skills
          </p>
          <nav className="flex items-center gap-6 font-mono text-[0.62rem]">
            <Link className="text-white/22 transition-colors hover:text-white/45" href="/sign-up">Get started</Link>
            <Link className="text-white/22 transition-colors hover:text-white/45" href="#skills">Skills</Link>
            <Link className="text-white/22 transition-colors hover:text-white/45" href="#how-it-works">How it works</Link>
            <Link className="text-white/22 transition-colors hover:text-white/45" href="/sign-in">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
