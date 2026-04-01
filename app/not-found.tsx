import type { Metadata } from "next";

import { AppGridShell } from "@/components/app-grid-shell";
import { SiteHeader } from "@/components/site-header";
import { LinkButton } from "@/components/ui/link-button";
import { PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/cn";
import { NOT_FOUND_PAGE_DESCRIPTION, NOT_FOUND_PAGE_TITLE } from "@/lib/not-found";
import { pageInsetColumnClass } from "@/lib/ui-layout";

export const metadata: Metadata = {
  title: NOT_FOUND_PAGE_TITLE,
  description: NOT_FOUND_PAGE_DESCRIPTION
};

export default function NotFound() {
  return (
    <AppGridShell header={<SiteHeader />}>
      <PageShell inset className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            pageInsetColumnClass("flex min-h-[min(60vh,520px)] flex-1 flex-col items-center justify-center gap-8 text-center"),
            "pb-12"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-ink-muted">
              Error 404
            </p>
            <h1 className="font-serif text-[clamp(2.75rem,8vw,4.25rem)] font-medium leading-none tracking-[-0.04em] text-ink text-balance">
              This path does not exist.
            </h1>
            <p className={cn("mx-auto mt-1 max-w-[min(100%,40ch)] text-pretty text-sm text-ink-muted")}>
              The URL may be mistyped, or the page was moved. Use search{" "}
              <kbd className="rounded-none border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-soft" title="Command palette – Ctrl+K on Windows">
                ⌘K
              </kbd>{" "}
              from anywhere in the app.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-3"
            role="group"
            aria-label="Suggested next steps"
          >
            <LinkButton href="/">Back to home</LinkButton>
            <LinkButton href="/sandbox" variant="soft">
              Open sandbox
            </LinkButton>
          </div>
        </div>
      </PageShell>
    </AppGridShell>
  );
}
