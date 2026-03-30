"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  PanelLeftIcon,
  PanelRightIcon,
  SparkIcon,
} from "@/components/frontier-icons";
import { SkillIcon, McpIcon } from "@/components/ui/skill-icon";
import { Separator } from "@/components/ui/shadcn/separator";
import { cn } from "@/lib/cn";
import {
  sandboxToolbarControl,
  sandboxToolbarLabel,
  sandboxContextCard,
  sandboxContextCardActive,
} from "@/lib/sandbox-ui";
import type {
  AgentProviderPreset,
  ImportedMcpDocument,
  SkillRecord,
} from "@/lib/types";

type SandboxRuntime = "node24" | "python3.13";

export type SandboxToolbarConfig = {
  runtime: SandboxRuntime;
  providerId: string;
  model: string;
  apiKeyEnvVar: string;
  selectedSkillSlugs: string[];
  selectedMcpIds: string[];
};

type SandboxToolbarProps = {
  config: SandboxToolbarConfig;
  presets: AgentProviderPreset[];
  skills: SkillRecord[];
  mcps: ImportedMcpDocument[];
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onUpdateConfig: <K extends keyof SandboxToolbarConfig>(
    key: K,
    value: SandboxToolbarConfig[K],
  ) => void;
  onToggleSkill: (slug: string) => void;
  onToggleMcp: (id: string) => void;
};

function PanelToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-faint transition-all duration-200 hover:bg-paper-3/80 hover:text-ink",
        active && "bg-paper-3/60 text-ink shadow-sm ring-1 ring-line/40",
      )}
      onClick={onClick}
      type="button"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function ContextSectionHeader({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-baseline gap-2 pb-2">
      <h3 className="m-0 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-ink-faint">
        {label}
      </h3>
      <span className="font-mono text-[0.5rem] tabular-nums text-ink-faint/60">
        {count > 0 ? (
          <>
            <span className="font-semibold text-accent">{count}</span>
            <span className="mx-0.5 opacity-50">/</span>
            {total}
          </>
        ) : (
          total
        )}
      </span>
    </div>
  );
}

export function SandboxToolbar({
  config,
  presets,
  skills,
  mcps,
  sidebarOpen,
  inspectorOpen,
  onToggleSidebar,
  onToggleInspector,
  onUpdateConfig,
  onToggleSkill,
  onToggleMcp,
}: SandboxToolbarProps) {
  const selectedPreset = presets.find((p) => p.id === config.providerId);
  const executableMcps = mcps.filter(
    (m) => m.transport === "stdio" || m.transport === "http",
  );

  const [contextOpen, setContextOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedSkillCount = config.selectedSkillSlugs.length;
  const selectedMcpCount = config.selectedMcpIds.length;
  const totalSelected = selectedSkillCount + selectedMcpCount;

  const closeDropdown = useCallback(() => setContextOpen(false), []);

  useEffect(() => {
    if (!contextOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        closeDropdown();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeDropdown();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextOpen, closeDropdown]);

  return (
    <div className="relative shrink-0 border-b border-line/60 bg-paper-2/30 backdrop-blur-sm dark:bg-paper-2/15">
      {/* Row: panel toggles + runtime/provider/model */}
      <div className="flex flex-wrap text-xs items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:px-4">
        <PanelToggle
          active={sidebarOpen}
          onClick={onToggleSidebar}
          label="Toggle sidebar"
        >
          <PanelLeftIcon className="h-3.5 w-3.5" />
        </PanelToggle>

        <Separator orientation="vertical" className="hidden h-3.5 opacity-30 sm:block" />

        <label className="flex items-center gap-1.5">
          <span className={sandboxToolbarLabel}>Runtime</span>
          <select
            className={sandboxToolbarControl}
            onChange={(e) =>
              onUpdateConfig("runtime", e.target.value as SandboxRuntime)
            }
            value={config.runtime}
          >
            <option value="node24">Node.js 24</option>
            <option value="python3.13">Python 3.13</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className={sandboxToolbarLabel}>Provider</span>
          <select
            className={cn(sandboxToolbarControl, "min-w-[7.5rem]")}
            onChange={(e) => {
              const preset = presets.find((p) => p.id === e.target.value);
              onUpdateConfig("providerId", e.target.value);
              if (preset) {
                onUpdateConfig("model", preset.defaultModel);
                onUpdateConfig("apiKeyEnvVar", preset.apiKeyEnvVar ?? "");
              }
            }}
            value={config.providerId}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-[min(100%,16rem)] sm:flex-initial">
          <span className={sandboxToolbarLabel}>Model</span>
          <input
            className={cn(
              sandboxToolbarControl,
              "min-w-0 flex-1 font-mono sm:w-48",
            )}
            onChange={(e) => onUpdateConfig("model", e.target.value)}
            placeholder={selectedPreset?.defaultModel}
            value={config.model}
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            ref={triggerRef}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-lg px-2 text-[0.6rem] font-medium text-ink-faint transition-all duration-200",
              "border border-transparent hover:border-line/60 hover:bg-paper-3/60 hover:text-ink",
              contextOpen && "border-accent/30 bg-accent/[0.06] text-accent shadow-sm",
            )}
            onClick={() => setContextOpen((p) => !p)}
            type="button"
            aria-expanded={contextOpen}
          >
            {totalSelected > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/12 px-1 font-mono text-[0.5rem] font-semibold tabular-nums text-accent">
                {totalSelected}
              </span>
            )}
            <SparkIcon className="h-3 w-3" />
            Context
            {contextOpen ? (
              <ChevronUpIcon className="h-3 w-3 opacity-50" />
            ) : (
              <ChevronDownIcon className="h-3 w-3 opacity-50" />
            )}
          </button>

          <Separator orientation="vertical" className="hidden h-3.5 opacity-30 sm:block" />

          <PanelToggle
            active={inspectorOpen}
            onClick={onToggleInspector}
            label="Toggle VM inspector"
          >
            <PanelRightIcon className="h-3.5 w-3.5" />
          </PanelToggle>
        </div>
      </div>

      {/* Floating context dropdown */}
      {contextOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={closeDropdown}
          />

          <div
            ref={dropdownRef}
            className={cn(
              "absolute right-3 top-full z-50 mt-1.5 w-[min(560px,calc(100vw-2rem))]",
              "origin-top-right animate-in fade-in slide-in-from-top-1 duration-150",
              "overflow-hidden rounded-xl border border-line/60 bg-paper-3/95 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-xl",
              "dark:border-line/40 dark:bg-paper-3/90 dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)]",
            )}
          >
            <div className="max-h-[min(50vh,420px)] overflow-y-auto overscroll-contain px-4 py-3.5">
              {/* Skills */}
              <ContextSectionHeader
                label="Skills"
                count={selectedSkillCount}
                total={skills.length}
              />
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {skills.slice(0, 24).map((skill) => {
                  const active = config.selectedSkillSlugs.includes(skill.slug);
                  return (
                    <button
                      className={cn(
                        sandboxContextCard,
                        active && sandboxContextCardActive,
                      )}
                      key={skill.slug}
                      onClick={() => onToggleSkill(skill.slug)}
                      type="button"
                    >
                      <SkillIcon
                        slug={skill.slug}
                        iconUrl={skill.iconUrl}
                        size={15}
                        className="shrink-0"
                      />
                      <span className="min-w-0 text-xs truncate">{skill.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* MCPs */}
              {executableMcps.length > 0 && (
                <div className="mt-3 border-t border-line/25 pt-3">
                  <ContextSectionHeader
                    label="MCPs"
                    count={selectedMcpCount}
                    total={executableMcps.length}
                  />
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {executableMcps.slice(0, 24).map((mcp) => {
                      const active = config.selectedMcpIds.includes(mcp.id);
                      return (
                        <button
                          className={cn(
                            sandboxContextCard,
                            active && sandboxContextCardActive,
                          )}
                          key={mcp.id}
                          onClick={() => onToggleMcp(mcp.id)}
                          type="button"
                        >
                          <McpIcon
                            name={mcp.name}
                            iconUrl={mcp.iconUrl}
                            homepageUrl={mcp.homepageUrl}
                            size={15}
                            className="shrink-0"
                          />
                          <span className="min-w-0 text-xs truncate">{mcp.name}</span>
                          <span className="ml-auto shrink-0 rounded-md bg-paper-2/80 px-1.5 py-0.5 text-[0.55rem] font-medium text-ink-faint ring-1 ring-line/30 dark:bg-paper-2">
                            {mcp.transport}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
