"use client";

import Link from "next/link";

import { PlusIcon, SearchIcon, SettingsIcon, TerminalIcon } from "@/components/frontier-icons";
import { LoopLogo } from "@/components/loop-logo";

export function SiteHeader({ onNewSkill }: { onNewSkill?: () => void }) {
  return (
    <header className="sticky top-0 z-60 px-4 pt-4 max-md:px-2.5 max-md:pt-2.5">
      <div className="mx-auto flex min-h-[56px] w-[min(1180px,calc(100vw-32px))] items-center gap-3 rounded-2xl border border-line/90 bg-paper/88 px-4 py-2.5 backdrop-blur-xl max-md:w-[min(100vw-20px,1180px)]">
        <Link className="inline-flex items-center gap-2.5" href="/">
          <LoopLogo className="h-8 w-8" />
          <strong className="text-base font-semibold tracking-tight">Loop</strong>
        </Link>

        <div className="flex-1" />

        <button
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper-2/80 px-3 py-1.5 text-sm text-ink-soft transition-colors duration-150 hover:border-accent hover:text-ink"
          onClick={() =>
            window.dispatchEvent(new Event("skillwire:open-palette"))
          }
          type="button"
        >
          <SearchIcon className="h-3.5 w-3.5" />
          <span className="max-sm:hidden">Search</span>
          <kbd className="ml-1 text-[0.7rem] text-ink-faint max-sm:hidden">
            ⌘K
          </kbd>
        </button>

        {onNewSkill ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
            onClick={onNewSkill}
            type="button"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">New</span>
          </button>
        ) : null}

        <Link
          className="inline-flex items-center justify-center rounded-xl p-2 text-ink-soft transition-colors duration-150 hover:bg-paper-2 hover:text-ink"
          href="/sandbox"
          title="Sandbox"
        >
          <TerminalIcon className="h-4 w-4" />
        </Link>

        <Link
          className="inline-flex items-center justify-center rounded-xl p-2 text-ink-soft transition-colors duration-150 hover:bg-paper-2 hover:text-ink"
          href="/settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
