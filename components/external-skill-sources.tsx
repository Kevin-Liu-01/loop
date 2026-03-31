"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";

import { DownloadIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useTrackedOperation } from "@/hooks/use-tracked-operation";
import { Tip } from "@/components/ui/tip";
import { formatTagLabel } from "@/lib/tag-utils";
import { cn } from "@/lib/cn";

function SourceIcon({ src, size }: { src: string; size: number }) {
  const pad = Math.max(2, Math.round(size * 0.14));
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/10"
      style={{ width: size, height: size }}
    >
      <img
        alt=""
        className="shrink-0 object-contain"
        height={size - pad * 2}
        src={src}
        width={size - pad * 2}
      />
    </span>
  );
}

type DiscoveredSkill = {
  sourceId: string;
  sourceName: string;
  slug: string;
  path: string;
  skillMdUrl: string;
};

type SourceResult = {
  source: {
    id: string;
    name: string;
    org: string;
    repo: string;
    iconUrl: string;
    description: string;
    homepage: string;
    trustTier: "official" | "community";
    discoveryMode: "canonical" | "lead-list";
    searchQueries: string[];
    discoveryRationale: string;
  };
  skills: DiscoveredSkill[];
  count: number;
};

type ApiResponse = {
  ok: boolean;
  sources: SourceResult[];
  totalSkills: number;
};

export function ExternalSkillSources() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { start: startTrackedOp } = useTrackedOperation();

  useEffect(() => {
    fetch("/api/imports/external")
      .then(async (res) => {
        if (!res.ok) {
          setError(`Failed to load sources (${res.status})`);
          return;
        }
        const json = (await res.json()) as ApiResponse;
        setData(json);
        if (!json.sources || json.sources.length === 0) {
          setError("No external sources returned. GitHub API rate limit may have been reached.");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch external sources");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleImport = useCallback(
    (skill: DiscoveredSkill) => {
      setImportingSlug(skill.slug);
      setMessage(null);

      const op = startTrackedOp({
        kind: "skill-import",
        label: skill.slug,
        slug: skill.slug,
        totalSteps: 2,
      });

      startTransition(async () => {
        const res = await fetch("/api/imports", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "skill", url: skill.skillMdUrl }),
        });

        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
          skill?: { slug?: string };
        };

        if (!res.ok || !payload.skill?.slug) {
          const errorMsg = `Failed to import ${skill.slug}: ${payload.error ?? "Unknown error"}`;
          setMessage(errorMsg);
          setImportingSlug(null);
          op.fail(errorMsg);
          return;
        }

        op.advance({ message: "Imported, now tracking..." });

        const trackRes = await fetch("/api/skills/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: payload.skill.slug }),
        });

        const trackPayload = (await trackRes.json().catch(() => ({}))) as {
          error?: string;
          href?: string;
        };

        setImportingSlug(null);

        if (trackPayload.href) {
          op.complete(`Imported ${skill.slug}`);
          router.push(trackPayload.href);
          router.refresh();
        } else {
          const msg = `Imported ${skill.slug} but could not create editable copy.`;
          setMessage(msg);
          op.fail(msg);
        }
      });
    },
    [router, startTrackedOp]
  );

  if (loading) {
    return (
      <Panel className="grid gap-4 content-start">
        <PanelHead>
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Discover
            </span>
            <h2>External Skill Sources</h2>
          </div>
        </PanelHead>
        <p className="text-sm text-ink-faint">Loading external sources...</p>
      </Panel>
    );
  }

  if (!data || data.sources.length === 0) {
    return (
      <Panel className="grid gap-4 content-start">
        <PanelHead>
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Discover
            </span>
            <h2>External Skill Sources</h2>
          </div>
        </PanelHead>
        {error ? (
          <p className="text-sm text-ink-soft">{error}</p>
        ) : (
          <p className="text-sm text-ink-faint">
            No external skill sources available right now. GitHub API rate limits may apply
            for unauthenticated requests.
          </p>
        )}
      </Panel>
    );
  }

  return (
    <Panel className="grid gap-5 content-start">
      <PanelHead>
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Discover
          </span>
          <h2>External Skill Sources</h2>
        </div>
        <Tip content="Total discovered skills across all external sources" side="left">
          <span><Badge color="green">{data.totalSkills} available</Badge></span>
        </Tip>
      </PanelHead>

      <p className="text-sm text-ink-soft">
        Import skills from Anthropic, OpenAI, and community repositories. Each skill becomes an
        editable, auto-updating loop in your workspace.
      </p>

      {message && <p className="text-sm text-ink-soft">{message}</p>}

      <div className="grid gap-4">
        {data.sources.map((result) => (
          <details
            className="group rounded-2xl border border-line bg-paper-3 open:bg-paper-2"
            key={result.source.id}
          >
            <summary className="flex cursor-pointer items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <SourceIcon size={28} src={result.source.iconUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-semibold text-ink">{result.source.name}</strong>
                  <Badge color="blue" size="sm">{result.count} skills</Badge>
                  <Tip content={result.source.trustTier === "official" ? "Maintained by the vendor" : "Community-maintained source"} side="top">
                    <span><Badge color={result.source.trustTier === "official" ? "orange" : "neutral"} size="sm">{formatTagLabel(result.source.trustTier)}</Badge></span>
                  </Tip>
                  <Tip content={result.source.discoveryMode === "canonical" ? "Fixed set of known skill paths" : "Discovered via search heuristics"} side="top">
                    <span><Badge color="indigo" size="sm">{formatTagLabel(result.source.discoveryMode)}</Badge></span>
                  </Tip>
                </div>
                <p className="m-0 line-clamp-1 text-xs text-ink-faint">{result.source.description}</p>
              </div>
              <Tip content="Open repository homepage" side="left">
                <a
                  className="shrink-0 text-ink-faint hover:text-ink-soft"
                  href={result.source.homepage}
                  onClick={(e) => e.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </Tip>
            </summary>

            <div className="border-t border-line px-4 py-3">
              <div className="mb-3 grid gap-1">
                <p className="m-0 text-xs leading-relaxed text-ink-soft">
                  {result.source.discoveryRationale}
                </p>
                <p className="m-0 text-[0.7rem] text-ink-faint">
                  Query hints: {result.source.searchQueries.join(" · ")}
                </p>
              </div>

              <div className="grid gap-2">
                {result.skills.map((skill) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-line bg-paper-3 px-3 py-2.5",
                      importingSlug === skill.slug && "opacity-60"
                    )}
                    key={`${skill.sourceId}:${skill.slug}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-ink">{skill.slug}</span>
                      <p className="m-0 text-xs text-ink-faint">
                        {skill.sourceId} · {skill.path}
                      </p>
                    </div>
                    <Tip content="Import skill and start tracking updates" side="left">
                      <Button
                        disabled={isPending && importingSlug === skill.slug}
                        onClick={() => handleImport(skill)}
                        size="sm"
                        variant="ghost"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        {importingSlug === skill.slug ? "Importing..." : "Import"}
                      </Button>
                    </Tip>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </Panel>
  );
}
