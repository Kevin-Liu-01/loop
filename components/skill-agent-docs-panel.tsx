"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Image from "next/image";

import { CopyButton } from "@/components/copy-button";
import { ChevronDownIcon, CodeIcon, FileCodeIcon } from "@/components/frontier-icons";
import { cn } from "@/lib/cn";
import { getPlatformDocIcon } from "@/lib/skill-icons";
import type { AgentDocs } from "@/lib/types";
import { AGENT_DOC_FILENAMES } from "@/lib/types";

type SkillAgentDocsPanelProps = {
  agentDocs?: AgentDocs;
  skillSlug: string;
  skillHref: string;
};

const KNOWN_DOC_LABELS: Record<string, string> = {
  agents: "AGENTS.md",
  cursor: "cursor.md",
  claude: "claude.md",
  codex: "codex.md",
};

function docLabel(key: string): string {
  return KNOWN_DOC_LABELS[key] ?? `${key}.md`;
}

function PlatformDocTabIcon({ docKey }: { docKey: string }) {
  const brand = getPlatformDocIcon(docKey);
  if (brand) {
    return (
      <Image
        src={brand.src}
        alt={brand.alt}
        width={14}
        height={14}
        className="shrink-0 dark:invert"
        unoptimized
      />
    );
  }
  return <CodeIcon className="h-3 w-3" />;
}

export function SkillAgentDocsPanel({ agentDocs, skillSlug, skillHref }: SkillAgentDocsPanelProps) {
  const entries = Object.entries(agentDocs ?? {}).filter(
    ([, content]) => typeof content === "string" && content.trim().length > 0
  ) as [string, string][];

  const [activeTab, setActiveTab] = useState<string>(entries[0]?.[0] ?? "");

  if (entries.length === 0) return null;

  const activeContent = agentDocs?.[activeTab] ?? "";

  return (
    <section className="border-t border-line pt-8" id="agent-docs">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          <FileCodeIcon className="h-4 w-4 text-ink-soft" />
          <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
            Agent docs
          </h2>
          <span className="text-xs font-normal tabular-nums text-ink-faint">
            {entries.length} attached
          </span>
          <ChevronDownIcon className="ml-auto h-3.5 w-3.5 text-ink-faint transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-4 overflow-hidden rounded-none border border-line">
          <div className="flex border-b border-line bg-paper-3/60 dark:bg-paper-2/30">
            {entries.map(([key]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                  activeTab === key
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-soft hover:text-ink"
                )}
              >
                <PlatformDocTabIcon docKey={key} />
                {docLabel(key)}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute right-3 top-3 z-10">
              <CopyButton
                className="text-xs"
                iconSize="sm"
                label="Copy"
                size="sm"
                usageEvent={{
                  kind: "copy_agent_doc",
                  label: `Copied ${docLabel(activeTab)}`,
                  path: skillHref,
                  skillSlug,
                }}
                value={activeContent}
                variant="soft"
              />
            </div>
            <div className="markdown-shell p-5 sm:p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
