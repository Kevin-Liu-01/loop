import Link from "next/link";

import { AppGridShell } from "@/components/app-grid-shell";
import { CopyButton } from "@/components/copy-button";
import { ExpandableContent } from "@/components/expandable-content";
import { GlobeIcon, KeyIcon, PlayIcon, TerminalIcon } from "@/components/frontier-icons";
import { McpDetailSidebar } from "@/components/mcp-detail-sidebar";
import { ShareButton } from "@/components/share-button";
import { SiteHeader } from "@/components/site-header";
import { McpIcon } from "@/components/ui/skill-icon";
import { UsageBeacon } from "@/components/usage-beacon";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { getTagColorForTransport } from "@/lib/tag-utils";
import { cn } from "@/lib/cn";
import { buildMcpVersionHref, formatRelativeDate } from "@/lib/format";
import { supportsSandboxMcp } from "@/lib/mcp-utils";
import { pageInsetPadX } from "@/lib/ui-layout";
import type { ImportedMcpDocument, VersionReference } from "@/lib/types";

const sectionH2 = "m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink";
const codeSurface =
  "rounded-none border border-line bg-paper-2/50 p-4 dark:bg-paper-2/25";
const metaLabel = "text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-soft";
const metaValue = "text-sm font-semibold tracking-[-0.03em] text-ink";

type McpDetailPageProps = {
  mcp: ImportedMcpDocument;
};

function buildAvailableVersions(mcp: ImportedMcpDocument): VersionReference[] {
  const current: VersionReference = {
    version: mcp.version,
    label: mcp.versionLabel,
    updatedAt: mcp.updatedAt
  };

  const fromVersions: VersionReference[] = mcp.versions.map((v) => ({
    version: v.version,
    label: `v${v.version}`,
    updatedAt: v.updatedAt
  }));

  const seen = new Set<number>();
  const all = [current, ...fromVersions].filter((v) => {
    if (seen.has(v.version)) return false;
    seen.add(v.version);
    return true;
  });

  return all.sort((a, b) => b.version - a.version);
}

function formatTransportLabel(transport: string): string {
  switch (transport) {
    case "stdio":
      return "Standard I/O";
    case "http":
      return "HTTP";
    case "sse":
      return "Server-Sent Events";
    case "ws":
      return "WebSocket";
    default:
      return transport;
  }
}

function formatVerificationLabel(status?: ImportedMcpDocument["verificationStatus"]): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "partial":
      return "Partially verified";
    case "broken":
      return "Broken";
    case "unverified":
    default:
      return "Unverified";
  }
}

function formatInstallStrategy(strategy?: ImportedMcpDocument["installStrategy"]): string {
  switch (strategy) {
    case "remote-http":
      return "Remote HTTP";
    case "uvx":
      return "uvx";
    case "binary":
      return "Binary";
    case "manual":
      return "Manual";
    case "npx":
    default:
      return "npx";
  }
}

export function McpDetailPage({ mcp }: McpDetailPageProps) {
  const isRunnable = supportsSandboxMcp(mcp);
  const href = buildMcpVersionHref(mcp.name, mcp.version);
  const versions = buildAvailableVersions(mcp);
  const hasHeaders = mcp.headers && Object.keys(mcp.headers).length > 0;
  const docsHref = mcp.docsUrl ?? mcp.homepageUrl;

  return (
    <AppGridShell header={<SiteHeader />}>
      <UsageBeacon
        dedupeKey={`page:${href}`}
        kind="page_view"
        label="Opened MCP detail"
        path={href}
      />
      <PageShell inset className="flex min-h-0 flex-1 flex-col">
        <div className={cn("relative shrink-0 overflow-hidden border-b border-line py-4", pageInsetPadX)}>
          <header className="relative z-10 grid gap-4">
            <Link
              className="w-fit text-xs font-medium text-ink-faint transition-colors hover:text-ink"
              href="/"
            >
              &larr; Back to MCPs
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Badge color={getTagColorForTransport(mcp.transport)}>{mcp.transport.toUpperCase()}</Badge>
              <Badge color="neutral">{mcp.versionLabel}</Badge>
              <Badge color="teal">{formatVerificationLabel(mcp.verificationStatus)}</Badge>
              {isRunnable ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Sandbox ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint">
                  <span className="inline-block h-2 w-2 rounded-full bg-ink-faint/40" />
                  Hidden from sandbox
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <McpIcon
                className="rounded-lg"
                homepageUrl={mcp.homepageUrl}
                iconUrl={mcp.iconUrl}
                name={mcp.name}
                size={36}
              />
              <h1 className="m-0 font-serif text-2xl font-medium tracking-[-0.03em] text-ink wrap-break-word">
                {mcp.name}
              </h1>
              <ShareButton href={href} />
            </div>
            <p className="m-0 max-w-[min(100%,52ch)] text-pretty text-sm leading-relaxed text-ink-muted wrap-break-word">
              {mcp.description}
            </p>

            {mcp.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mcp.tags.map((tag) => (
                  <span
                    className="rounded bg-paper-3 px-2 py-0.5 text-xs font-medium text-ink-soft"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="m-0 text-xs leading-normal text-ink-soft tabular-nums">
              {mcp.envKeys.length} env key{mcp.envKeys.length !== 1 ? "s" : ""}
              {" · "}Updated {formatRelativeDate(mcp.updatedAt)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {isRunnable ? (
                <LinkButton
                  href={`/sandbox?mcp=${encodeURIComponent(mcp.slug ?? mcp.name)}`}
                  size="sm"
                  variant="primary"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  Run in sandbox
                </LinkButton>
              ) : null}
              {docsHref ? (
                <LinkButton
                  href={docsHref}
                  rel="noreferrer"
                  size="sm"
                  target="_blank"
                  variant="soft"
                >
                  <GlobeIcon className="h-3.5 w-3.5" />
                  Docs
                </LinkButton>
              ) : null}
              <CopyButton
                className="text-xs"
                iconSize="sm"
                label="Copy manifest URL"
                size="sm"
                usageEvent={{
                  kind: "copy_url",
                  label: "Copied MCP manifest URL",
                  path: href
                }}
                value={mcp.manifestUrl}
                variant="soft"
              />
              <CopyButton
                className="text-xs"
                iconSize="sm"
                label="Copy link"
                size="sm"
                usageEvent={{
                  kind: "copy_url",
                  label: "Copied MCP link",
                  path: href
                }}
                value={href}
                variant="soft"
              />
            </div>
          </header>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto border-line py-5 pb-16 sm:py-6 lg:border-r",
              pageInsetPadX
            )}
          >
            <div className="grid gap-8">
              <ConnectionDetailsSection mcp={mcp} />

              {mcp.envKeys.length > 0 && (
                <EnvironmentKeysSection envKeys={mcp.envKeys} />
              )}

              {hasHeaders && (
                <HeadersSection headers={mcp.headers!} />
              )}

              <RawManifestSection raw={mcp.raw} />
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 w-full overflow-y-auto border-t border-line py-5 pb-16 sm:py-6 lg:w-80 lg:shrink-0 lg:border-t-0",
              pageInsetPadX
            )}
          >
            <McpDetailSidebar
              currentVersion={mcp.version}
              mcpName={mcp.name}
              sandboxHref={`/sandbox?mcp=${encodeURIComponent(mcp.slug ?? mcp.name)}`}
              sandboxSupported={mcp.sandboxSupported}
              manifestUrl={mcp.manifestUrl}
              docsHref={docsHref}
              transport={mcp.transport}
              envKeyCount={mcp.envKeys.length}
              tags={mcp.tags}
              versions={versions}
            />
          </div>
        </div>
      </PageShell>
    </AppGridShell>
  );
}

function ConnectionDetailsSection({ mcp }: { mcp: ImportedMcpDocument }) {
  return (
    <section id="connection" className="grid gap-5">
      <h2 className={sectionH2}>Connection details</h2>

      <Panel square>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="grid gap-0.5">
            <small className={metaLabel}>transport</small>
            <strong className={metaValue}>{formatTransportLabel(mcp.transport)}</strong>
          </div>

          <div className="grid gap-0.5">
            <small className={metaLabel}>verification</small>
            <strong className={metaValue}>{formatVerificationLabel(mcp.verificationStatus)}</strong>
          </div>

          <div className="grid gap-0.5">
            <small className={metaLabel}>install</small>
            <strong className={metaValue}>{formatInstallStrategy(mcp.installStrategy)}</strong>
          </div>

          <div className="grid gap-0.5">
            <small className={metaLabel}>auth</small>
            <strong className={metaValue}>{mcp.authType ?? "unknown"}</strong>
          </div>

          {mcp.url && (
            <div className="col-span-2 grid gap-0.5">
              <small className={metaLabel}>url</small>
              <code className="truncate font-mono text-sm text-ink">{mcp.url}</code>
            </div>
          )}

          {mcp.command && (
            <div className="col-span-2 grid gap-0.5 sm:col-span-3">
              <small className={metaLabel}>command</small>
              <div className={cn(codeSurface, "flex items-center gap-2")}>
                <TerminalIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                <code className="block whitespace-pre-wrap font-mono text-sm text-ink wrap-break-word">
                  {mcp.command}{mcp.args.length > 0 ? ` ${mcp.args.join(" ")}` : ""}
                </code>
              </div>
            </div>
          )}

          {mcp.args.length > 0 && !mcp.command && (
            <div className="col-span-2 grid gap-0.5">
              <small className={metaLabel}>args</small>
              <code className="font-mono text-sm text-ink">{mcp.args.join(" ")}</code>
            </div>
          )}

          {mcp.sandboxNotes ? (
            <div className="col-span-2 grid gap-0.5 sm:col-span-3">
              <small className={metaLabel}>sandbox notes</small>
              <p className="m-0 text-sm text-ink-soft">{mcp.sandboxNotes}</p>
            </div>
          ) : null}
        </div>
      </Panel>
    </section>
  );
}

function EnvironmentKeysSection({ envKeys }: { envKeys: string[] }) {
  return (
    <section className="grid gap-5 border-t border-line pt-8" id="env-keys">
      <div className="flex items-center justify-between gap-3">
        <h2 className={sectionH2}>
          <span className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-ink-soft" />
            Environment keys
          </span>
        </h2>
        <CopyButton
          className="text-xs"
          iconSize="sm"
          label="Copy all"
          size="sm"
          value={envKeys.join("\n")}
          variant="soft"
        />
      </div>

      <Panel square>
        <div className="grid gap-1.5">
          {envKeys.map((key) => (
            <div
              className="flex items-center justify-between gap-2 rounded-none border border-line bg-paper-2/50 px-3 py-2 dark:bg-paper-2/25"
              key={key}
            >
              <code className="truncate font-mono text-sm text-ink">{key}</code>
              <CopyButton
                iconOnly
                iconSize="sm"
                label="Copy"
                size="sm"
                value={key}
                variant="ghost"
              />
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function HeadersSection({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);

  return (
    <section className="grid gap-5 border-t border-line pt-8" id="headers">
      <h2 className={sectionH2}>Headers</h2>

      <Panel square>
        <div className="grid gap-1.5">
          {entries.map(([key, value]) => (
            <div
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-none border border-line bg-paper-2/50 px-3 py-2 dark:bg-paper-2/25"
              key={key}
            >
              <code className="font-mono text-sm font-semibold text-ink">{key}</code>
              <code className="truncate font-mono text-sm text-ink-soft">{value}</code>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function RawManifestSection({ raw }: { raw: string }) {
  let formatted = raw;
  try {
    const parsed = JSON.parse(raw);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // not JSON, show as-is
  }

  return (
    <section className="grid gap-5 border-t border-line pt-8" id="manifest">
      <div className="flex items-center justify-between gap-3">
        <h2 className={sectionH2}>Raw manifest</h2>
        <CopyButton
          className="text-xs"
          iconSize="sm"
          label="Copy"
          size="sm"
          value={formatted}
          variant="soft"
        />
      </div>

      <div className={cn(codeSurface, "p-0")}>
        <ExpandableContent maxHeight={480}>
          <pre className="overflow-x-auto p-4">
            <code className="block whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink wrap-break-word">
              {formatted}
            </code>
          </pre>
        </ExpandableContent>
      </div>
    </section>
  );
}
