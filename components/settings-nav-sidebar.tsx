"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AutomationIcon,
  CreditCardIcon,
  LinkIcon,
  PulseIcon,
  RefreshIcon,
  SettingsIcon,
} from "@/components/frontier-icons";
import { cn } from "@/lib/cn";
import { SETTINGS_NAV_ITEMS, settingsPath, type SettingsNavId } from "@/lib/settings-nav";
import { pageInsetPadX } from "@/lib/ui-layout";

const navIconClass = "h-4 w-4 shrink-0";

function NavIcon({ id, active }: { id: SettingsNavId; active: boolean }) {
  const cls = cn(navIconClass, active ? "text-ink" : "text-ink-faint");
  switch (id) {
    case "subscription":
      return <CreditCardIcon className={cls} aria-hidden />;
    case "connect":
      return <LinkIcon className={cls} aria-hidden />;
    case "refresh":
      return <RefreshIcon className={cls} aria-hidden />;
    case "automations":
      return <AutomationIcon className={cls} aria-hidden />;
    case "health":
      return <PulseIcon className={cls} aria-hidden />;
    default:
      return null;
  }
}

export function SettingsNavSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Settings"
      className={cn(
        "flex shrink-0 flex-col border-b border-line lg:border-b-0 lg:border-r",
        "lg:w-[min(260px,28vw)] lg:min-w-[220px] lg:max-w-[280px]"
      )}
    >
      {/* ── Brand block ── */}
      <div
        className={cn(
          "relative grid gap-4 overflow-hidden border-b border-line p-5 lg:p-6",
          "bg-gradient-to-b from-paper-2/60 via-paper to-paper dark:from-paper-2/40 dark:via-paper dark:to-paper"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/[0.04] blur-2xl dark:bg-accent/[0.06]"
        />

        <div className="relative flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]",
              "border border-line/80 bg-paper-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.02)]",
              "dark:border-line dark:bg-paper-3/80 dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]"
            )}
          >
            <SettingsIcon className="h-[18px] w-[18px] text-ink-soft" aria-hidden />
          </span>
          <h2 className="m-0 min-w-0 font-serif text-[1.125rem] font-medium leading-tight tracking-[-0.03em] text-ink">
            Settings
          </h2>
        </div>

        <p className="relative m-0 text-pretty text-[0.8125rem] leading-[1.55] text-ink-soft">
          Billing, payouts, sync, and how Loop runs for you.
        </p>
      </div>

      {/* ── Nav links ── */}
      <nav
        aria-label="Settings sections"
        className={cn("grid gap-0.5 py-3", pageInsetPadX)}
      >
        {SETTINGS_NAV_ITEMS.map((item) => {
          const href = settingsPath(item.id);
          const active = pathname === href;
          return (
            <Link
              key={item.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2.5 px-2.5 py-[7px] text-[0.8125rem] font-medium tracking-tight transition-all duration-150",
                active
                  ? "bg-paper-3 text-ink shadow-[0_1px_2px_0_rgba(0,0,0,0.04),inset_0_0_0_1px_var(--color-line)] dark:bg-paper-3/50 dark:shadow-[0_0_0_1px_var(--color-line)]"
                  : "text-ink-muted hover:bg-paper-3/70 hover:text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              )}
            >
              <NavIcon id={item.id} active={active} />
              <span className="min-w-0">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
