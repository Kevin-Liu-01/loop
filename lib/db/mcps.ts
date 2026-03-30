import { getServerSupabase } from "@/lib/db/client";
import { buildVersionLabel } from "@/lib/format";
import type { ImportedMcpDocument, ImportedMcpVersion } from "@/lib/types";

type McpRow = {
  id: string;
  name: string;
  description: string;
  manifest_url: string;
  homepage_url: string | null;
  transport: string;
  url: string | null;
  command: string | null;
  args: string[];
  env_keys: string[];
  headers: unknown;
  tags: string[];
  raw: string;
  version: number;
  version_label: string;
  created_at: string;
  updated_at: string;
  icon_url: string | null;
};

function rowToMcpDocument(row: McpRow, versions?: ImportedMcpVersion[]): ImportedMcpDocument {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    manifestUrl: row.manifest_url,
    homepageUrl: row.homepage_url ?? undefined,
    transport: row.transport as ImportedMcpDocument["transport"],
    url: row.url ?? undefined,
    command: row.command ?? undefined,
    args: row.args,
    envKeys: row.env_keys,
    headers: (row.headers ?? undefined) as Record<string, string> | undefined,
    tags: row.tags,
    raw: row.raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    versionLabel: row.version_label,
    versions: versions ?? [],
    iconUrl: row.icon_url ?? undefined
  };
}

function mcpToRow(mcp: ImportedMcpDocument): Record<string, unknown> {
  return {
    id: mcp.id,
    name: mcp.name,
    description: mcp.description,
    manifest_url: mcp.manifestUrl,
    homepage_url: mcp.homepageUrl ?? null,
    transport: mcp.transport,
    url: mcp.url ?? null,
    command: mcp.command ?? null,
    args: mcp.args,
    env_keys: mcp.envKeys,
    headers: mcp.headers ?? null,
    tags: mcp.tags,
    raw: mcp.raw,
    version: mcp.version,
    version_label: mcp.versionLabel,
    icon_url: mcp.iconUrl ?? null
  };
}

export async function listMcps(): Promise<ImportedMcpDocument[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("imported_mcps")
    .select("*")
    .order("name");

  if (error) throw new Error(`listMcps failed: ${error.message}`);

  const mcpIds = (data as McpRow[]).map((row) => row.id);

  const { data: allVersions } = mcpIds.length > 0
    ? await db
        .from("imported_mcp_versions")
        .select("*")
        .in("mcp_id", mcpIds)
        .order("version", { ascending: false })
    : { data: [] };

  const versionsByMcp = new Map<string, ImportedMcpVersion[]>();
  for (const v of (allVersions ?? []) as Array<{
    mcp_id: string;
    version: number;
    description: string;
    manifest_url: string;
    homepage_url: string | null;
    transport: string;
    url: string | null;
    command: string | null;
    args: string[];
    env_keys: string[];
    headers: unknown;
    tags: string[];
    raw: string;
    created_at: string;
  }>) {
    const list = versionsByMcp.get(v.mcp_id) ?? [];
    list.push({
      version: v.version,
      updatedAt: v.created_at,
      description: v.description,
      manifestUrl: v.manifest_url,
      homepageUrl: v.homepage_url ?? undefined,
      transport: v.transport as ImportedMcpVersion["transport"],
      url: v.url ?? undefined,
      command: v.command ?? undefined,
      args: v.args,
      envKeys: v.env_keys,
      headers: (v.headers ?? undefined) as Record<string, string> | undefined,
      tags: v.tags,
      raw: v.raw
    });
    versionsByMcp.set(v.mcp_id, list);
  }

  return (data as McpRow[]).map((row) =>
    rowToMcpDocument(row, versionsByMcp.get(row.id))
  );
}

export async function upsertMcp(mcp: ImportedMcpDocument): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db
    .from("imported_mcps")
    .upsert(mcpToRow(mcp) as never, { onConflict: "id" });

  if (error) throw new Error(`upsertMcp failed: ${error.message}`);
}

export async function createMcpVersion(mcpId: string, version: ImportedMcpVersion): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("imported_mcp_versions").insert({
    mcp_id: mcpId,
    version: version.version,
    description: version.description,
    manifest_url: version.manifestUrl,
    homepage_url: version.homepageUrl ?? null,
    transport: version.transport,
    url: version.url ?? null,
    command: version.command ?? null,
    args: version.args,
    env_keys: version.envKeys,
    headers: version.headers ?? null,
    tags: version.tags,
    raw: version.raw
  } as never);

  if (error) throw new Error(`createMcpVersion failed: ${error.message}`);
}
