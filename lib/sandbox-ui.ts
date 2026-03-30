/**
 * Shared UI tokens for the code sandbox (toolbar controls, surfaces, inspector).
 */

export const sandboxToolbarControl =
  "rounded-lg border border-line/80 bg-paper-3/80 px-2.5 py-1 text-[0.7rem] tabular-nums text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all duration-200 focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/10 hover:border-line-strong hover:bg-paper-3 dark:bg-paper-2/80 dark:shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:hover:bg-paper-3/50";

export const sandboxToolbarLabel =
  "text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-ink-faint";

/** Card for each skill/MCP item in the context panel grid. */
export const sandboxContextCard =
  "flex items-center gap-2 rounded-lg border border-line/60 bg-paper-3/50 px-2.5 py-1.5 text-left text-[0.68rem] font-medium leading-tight text-ink-soft shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-line-strong hover:bg-paper-3/90 hover:text-ink hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-paper-2/40 dark:shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:hover:bg-paper-3/30";

/** Active (selected) state overlay for context cards. */
export const sandboxContextCardActive =
  "border-accent/40 bg-accent/[0.06] text-ink shadow-[0_1px_4px_rgba(232,101,10,0.08),inset_0_0_0_1px_rgba(232,101,10,0.08)] hover:border-accent/55 hover:bg-accent/[0.09] dark:bg-accent/[0.08] dark:hover:bg-accent/[0.12]";

export const sandboxInspectorPanel =
  "flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l border-line/60 bg-paper-2/40 backdrop-blur-md dark:bg-paper-2/25";
