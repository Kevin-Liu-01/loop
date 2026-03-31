import type { CSSProperties, ReactNode } from "react";

import { LoopLogo } from "@/components/loop-logo";

const OPERATOR_BENEFITS = [
  "Unlimited skills",
  "AI-powered automations",
  "Model selection",
  "Custom imports",
  "Priority support",
] as const;

export type AuthSplitLayoutProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

const panelSurfaceStyle = {
  "--loop-auth-grad-from": "#141312",
  "--loop-auth-grad-mid": "#4a2618",
  "--loop-auth-grad-to": "var(--color-accent)",
  background:
    "linear-gradient(152deg, var(--loop-auth-grad-from) 0%, var(--loop-auth-grad-mid) 44%, var(--loop-auth-grad-to) 100%)",
} as CSSProperties;

export function AuthSplitLayout({ mode, children }: AuthSplitLayoutProps) {
  const title = mode === "sign-in" ? "Welcome to Loop" : "Join Loop";
  const subtitle =
    mode === "sign-in"
      ? "Operator keeps your skills, models, and automations in one place."
      : "Create your account and unlock the full Operator toolkit.";

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:flex-row">
      <section className="order-1 flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:order-none lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[28rem] text-ink">{children}</div>
      </section>

      <section
        className="relative isolate order-2 flex min-h-[min(320px,42vh)] flex-1 flex-col justify-between overflow-hidden px-6 py-8 text-white sm:px-10 sm:py-10 lg:order-none lg:min-h-dvh lg:max-w-[min(440px,44vw)] lg:shrink-0 lg:py-14 xl:px-12"
        style={panelSurfaceStyle}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.055) 1px, transparent 1px)
            `,
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--color-accent)]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/3 h-48 w-48 rounded-full bg-white/5 blur-2xl"
          aria-hidden
        />

        <div className="relative z-10 grid gap-6 lg:gap-8">
          <div className="flex items-center gap-2.5">
            <LoopLogo className="h-8 w-8 text-[#e8650a]" chipClassName="fill-white" />
            <span className="font-serif text-lg font-medium tracking-[-0.03em] text-white">
              Loop
            </span>
          </div>

          <div className="grid max-w-md gap-2 lg:gap-3">
            <h2 className="text-balance font-serif text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl lg:text-3xl">
              {title}
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-white/72 lg:text-base">{subtitle}</p>
          </div>

          <div className="grid gap-2 sm:gap-2.5">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-white/48">
              Operator benefits
            </p>
            <ul className="grid gap-2 text-sm text-white/90 sm:gap-2.5 sm:text-[0.9375rem]">
              {OPERATOR_BENEFITS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_3px_rgba(232,101,10,0.2)]"
                    aria-hidden
                  />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative z-10 mt-6 text-xs leading-relaxed text-white/38 lg:mt-10">
          <span className="lg:hidden">Skills, models, and support -- built for shipping fast.</span>
          <span className="hidden lg:inline">
            Skills, model choice, and priority support -- so you can ship automation without friction.
          </span>
        </p>
      </section>
    </div>
  );
}
