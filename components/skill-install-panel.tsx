"use client";

import { useState } from "react";
import Image from "next/image";

import { CopyButton } from "@/components/copy-button";
import { DownloadSkillButton } from "@/components/download-skill-button";
import {
  BotIcon,
  CodeIcon,
  UserIcon,
} from "@/components/frontier-icons";
import { Select } from "@/components/ui/select";
import { FileTree, type FileTreeEntry } from "@/components/ui/file-tree";
import { Panel } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { cn } from "@/lib/cn";
import { getPlatformDocIcon } from "@/lib/skill-icons";
import type { AgentDocs } from "@/lib/types";

type SkillInstallPanelProps = {
  slug: string;
  skillHref: string;
  agentPrompt: string;
  rawUrl: string;
  body: string;
  downloadFilename: string;
  agentDocs?: AgentDocs;
};

const sectionH2 = "m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink";

const PLATFORM_LABELS: Record<string, string> = {
  cursor: "Cursor",
  claude: "Claude Code",
  codex: "Codex CLI",
  agents: "AGENTS.md",
};

const PLATFORM_STEPS: Record<string, string[]> = {
  cursor: [
    "Copy the agent prompt below and paste it into Cursor chat.",
    "The skill will be immediately available to your agent.",
    "Read the SKILL.md content for usage instructions.",
  ],
  claude: [
    "Run the install command below in your terminal.",
    "The skill will be downloaded into your local Claude skills directory.",
    "Restart Claude Code (or start a new session) to use the skill.",
  ],
  codex: [
    "Copy the agent prompt and pass it to Codex CLI.",
    "Codex will fetch and apply the skill automatically.",
    "The skill is ready to use in your next session.",
  ],
  agents: [
    "Copy the AGENTS.md content into your project root.",
    "Any compatible agent will pick it up automatically.",
    "Customize the rules to fit your project needs.",
  ],
};

function buildAgentFileTree(agentDocs?: AgentDocs): FileTreeEntry[] {
  const children: FileTreeEntry[] = [
    { name: "SKILL.md", type: "file", icon: "markdown" },
  ];

  if (agentDocs) {
    for (const key of Object.keys(agentDocs)) {
      const content = agentDocs[key];
      if (content && content.trim().length > 0) {
        const filename =
          key === "agents" ? "AGENTS.md" :
          key === "cursor" ? "cursor.md" :
          key === "claude" ? "claude.md" :
          key === "codex" ? "codex.md" :
          `${key}.md`;
        children.push({ name: filename, type: "file", icon: "markdown" });
      }
    }
  }

  return children;
}

function PlatformIcon({ platformKey }: { platformKey: string }) {
  const brand = getPlatformDocIcon(platformKey);
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
  return <CodeIcon className="h-3.5 w-3.5" />;
}

function AgentTab({
  agentPrompt,
  skillHref,
  slug,
}: {
  agentPrompt: string;
  skillHref: string;
  slug: string;
}) {
  return (
    <div className="grid gap-4">
      <p className="m-0 text-sm text-ink-muted">
        Send this prompt to your agent to install the skill
      </p>

      <div className="overflow-hidden rounded-none border border-line">
        <div className="flex items-center justify-between border-b border-line bg-paper-3/60 px-4 py-2.5 dark:bg-paper-2/30">
          <span className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CodeIcon className="h-3.5 w-3.5" />
            Agent prompt
          </span>
          <CopyButton
            iconOnly
            label="Copy agent prompt"
            usageEvent={{
              kind: "copy_prompt",
              label: "Copied prompt from install panel",
              path: skillHref,
              skillSlug: slug,
            }}
            value={agentPrompt}
          />
        </div>
        <div className="bg-paper-2/40 px-4 py-4 dark:bg-paper-2/15">
          <code className="block whitespace-pre-wrap break-all font-mono text-[0.8rem] leading-relaxed text-accent">
            {agentPrompt}
          </code>
        </div>
      </div>

      <CopyButton
        block
        label="Copy Prompt"
        size="default"
        usageEvent={{
          kind: "copy_prompt",
          label: "Copied prompt via install CTA",
          path: skillHref,
          skillSlug: slug,
        }}
        value={agentPrompt}
        variant="primary"
      />
    </div>
  );
}

function HumanTab({
  slug,
  skillHref,
  rawUrl,
  body,
  downloadFilename,
  agentDocs,
}: {
  slug: string;
  skillHref: string;
  rawUrl: string;
  body: string;
  downloadFilename: string;
  agentDocs?: AgentDocs;
}) {
  const platformKeys = agentDocs
    ? Object.keys(agentDocs).filter(
        (k) => agentDocs[k] && agentDocs[k]!.trim().length > 0
      )
    : [];
  const [activePlatform, setActivePlatform] = useState<string>(
    platformKeys[0] ?? "cursor"
  );
  const steps = PLATFORM_STEPS[activePlatform] ?? PLATFORM_STEPS.cursor;
  const curlCmd = `curl -sL ${rawUrl} -o ${slug}-SKILL.md`;

  return (
    <div className="grid gap-4">
      {platformKeys.length > 1 && (
        <Select
          className="min-h-0 rounded-none bg-paper-3/60 px-4 py-2.5 text-sm font-medium dark:bg-paper-2/30"
          onChange={setActivePlatform}
          options={platformKeys.map((key) => ({ value: key, label: PLATFORM_LABELS[key] ?? key }))}
          value={activePlatform}
        />
      )}

      {platformKeys.length <= 1 && (
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <PlatformIcon platformKey={activePlatform} />
          {PLATFORM_LABELS[activePlatform] ?? activePlatform}
        </div>
      )}

      <ol className="m-0 grid list-none gap-2.5 p-0">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-paper-3 text-[0.7rem] font-semibold tabular-nums text-ink-soft">
              {i + 1}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed text-ink-muted">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <div className="overflow-hidden rounded-none border border-line">
        <div className="flex items-center justify-between border-b border-line bg-paper-3/60 px-4 py-2.5 dark:bg-paper-2/30">
          <span className="text-xs font-medium text-ink-soft">Install command</span>
          <CopyButton
            iconOnly
            label="Copy install command"
            usageEvent={{
              kind: "copy_url",
              label: "Copied install command",
              path: skillHref,
              skillSlug: slug,
            }}
            value={curlCmd}
          />
        </div>
        <div className="bg-paper-2/40 px-4 py-3 dark:bg-paper-2/15">
          <code className="block whitespace-pre-wrap break-all font-mono text-[0.8rem] leading-relaxed text-accent">
            {curlCmd}
          </code>
        </div>
      </div>

      <DownloadSkillButton body={body} filename={downloadFilename} />
    </div>
  );
}

export function SkillInstallPanel({
  slug,
  skillHref,
  agentPrompt,
  rawUrl,
  body,
  downloadFilename,
  agentDocs,
}: SkillInstallPanelProps) {
  const fileTreeEntries = buildAgentFileTree(agentDocs);

  return (
    <section className="border-t border-line pt-8" id="install">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          <CodeIcon className="h-4 w-4 text-ink-soft" />
          <h2 className={sectionH2}>Installation</h2>
          <ChevronDownIcon className="ml-auto h-3.5 w-3.5 text-ink-faint transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-4 grid gap-6">
          <Panel compact square>
            <Tabs defaultValue="agent">
              <TabsList className="w-full">
                <TabsTrigger className="flex-1 gap-1.5" value="agent">
                  <BotIcon className="h-3.5 w-3.5" />
                  I&apos;m an Agent
                </TabsTrigger>
                <TabsTrigger className="flex-1 gap-1.5" value="human">
                  <UserIcon className="h-3.5 w-3.5" />
                  I&apos;m a Human
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agent">
                <AgentTab
                  agentPrompt={agentPrompt}
                  skillHref={skillHref}
                  slug={slug}
                />
              </TabsContent>

              <TabsContent value="human">
                <HumanTab
                  agentDocs={agentDocs}
                  body={body}
                  downloadFilename={downloadFilename}
                  rawUrl={rawUrl}
                  skillHref={skillHref}
                  slug={slug}
                />
              </TabsContent>
            </Tabs>
          </Panel>

          {fileTreeEntries.length > 0 && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-sm font-semibold tracking-tight text-ink">
                  File Tree
                </h3>
                <span className="text-xs tabular-nums text-ink-faint">
                  {fileTreeEntries.length} {fileTreeEntries.length === 1 ? "file" : "files"}
                </span>
              </div>
              <FileTree entries={fileTreeEntries} />
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
