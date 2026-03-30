import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import { tool } from "ai";
import { z } from "zod";

import { stableHash } from "@/lib/markdown";
import type { ImportedMcpDocument } from "@/lib/types";

const MCP_PROTOCOL_VERSION = "2025-11-25";
const REQUEST_TIMEOUT_MS = 20_000;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id?: number;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

type McpToolDefinition = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
};

type McpToolResult = {
  content?: Array<Record<string, unknown>>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
  [key: string]: unknown;
};

type McpSession = {
  server: ImportedMcpDocument;
  initialize: () => Promise<void>;
  listTools: () => Promise<McpToolDefinition[]>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<McpToolResult>;
  close: () => Promise<void>;
};

type BuildRuntimeResult = {
  tools: Record<string, any>;
  warnings: string[];
  catalog: Array<{
    serverId: string;
    serverName: string;
    toolKey: string;
    toolName: string;
    title: string;
    description: string;
    transport: ImportedMcpDocument["transport"];
  }>;
  close: () => Promise<void>;
};

type PendingRequest = {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
};

function buildInitializeParams() {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {
      name: "loop",
      version: "0.1.0"
    }
  };
}

function isExecutableTransport(transport: ImportedMcpDocument["transport"]): boolean {
  return transport === "stdio" || transport === "http";
}

export function supportsExecutableMcpTransport(transport: ImportedMcpDocument["transport"]): boolean {
  return isExecutableTransport(transport);
}

function sanitizeToolKey(serverName: string, toolName: string): string {
  const base = `${serverName} ${toolName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${base || "mcp_tool"}_${stableHash(`${serverName}:${toolName}`).slice(0, 6)}`;
}

function schemaSummary(schema: Record<string, unknown> | undefined): string {
  if (!schema || typeof schema !== "object") {
    return "No input schema was published.";
  }

  const properties =
    schema.properties && typeof schema.properties === "object" ? Object.keys(schema.properties) : [];
  const required = Array.isArray(schema.required) ? schema.required.map(String) : [];

  return `Fields: ${properties.join(", ") || "none"}${required.length > 0 ? ` | Required: ${required.join(", ")}` : ""}`;
}

function formatToolDescription(server: ImportedMcpDocument, definition: McpToolDefinition): string {
  const hints = [
    definition.annotations?.readOnlyHint ? "read-only" : null,
    definition.annotations?.destructiveHint ? "destructive" : null,
    definition.annotations?.idempotentHint ? "idempotent" : null,
    definition.annotations?.openWorldHint ? "open-world" : null
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `MCP server: ${server.name}`,
    definition.title ? `Title: ${definition.title}` : null,
    definition.description ? `Description: ${definition.description}` : null,
    hints ? `Hints: ${hints}` : null,
    `Input schema: ${schemaSummary(definition.inputSchema)}`
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeToolResult(server: ImportedMcpDocument, toolName: string, result: McpToolResult) {
  return {
    server: server.name,
    tool: toolName,
    isError: Boolean(result.isError),
    structuredContent: result.structuredContent ?? null,
    content:
      result.content?.map((item) => {
        if (typeof item.text === "string") {
          return item.text;
        }

        return JSON.stringify(item);
      }) ?? [],
    raw: result
  };
}

function extractJsonRpcResult(message: JsonRpcResponse): Record<string, unknown> {
  if (message.error) {
    throw new Error(message.error.message);
  }

  return message.result ?? {};
}

class StdioMcpClient implements McpSession {
  readonly server: ImportedMcpDocument;
  private readonly proc: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, PendingRequest>();
  private nextId = 1;
  private buffer = "";

  constructor(server: ImportedMcpDocument) {
    if (!server.command) {
      throw new Error(`${server.name} is missing a command.`);
    }

    this.server = server;
    this.proc = spawn(server.command, server.args, {
      cwd: process.cwd(),
      stdio: "pipe",
      env: {
        ...process.env,
        PATH: process.env.PATH,
        ...Object.fromEntries(
          server.envKeys
            .map((key) => [key, process.env[key]])
            .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        )
      }
    });

    this.proc.stdout.setEncoding("utf8");
    this.proc.stdout.on("data", (chunk: string) => this.handleChunk(chunk));
    this.proc.stderr.on("data", () => {
      // stderr is treated as server logging and intentionally ignored here.
    });
    this.proc.on("exit", () => {
      this.pending.forEach((entry) => {
        clearTimeout(entry.timeout);
        entry.reject(new Error(`${this.server.name} exited before replying.`));
      });
      this.pending.clear();
    });
  }

  private handleChunk(chunk: string) {
    this.buffer += chunk;

    while (this.buffer.includes("\n")) {
      const newlineIndex = this.buffer.indexOf("\n");
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      try {
        const message = JSON.parse(line) as JsonRpcResponse;
        if (typeof message.id !== "number") {
          continue;
        }

        const pending = this.pending.get(message.id);
        if (!pending) {
          continue;
        }

        clearTimeout(pending.timeout);
        this.pending.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result ?? {});
        }
      } catch {
        // Ignore malformed log lines.
      }
    }
  }

  private send(message: JsonRpcRequest) {
    this.proc.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private request(method: string, params?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.server.name} timed out on ${method}.`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, {
        resolve,
        reject,
        timeout
      });

      this.send({
        jsonrpc: "2.0",
        id,
        method,
        params
      });
    });
  }

  private notify(method: string, params?: Record<string, unknown>) {
    this.send({
      jsonrpc: "2.0",
      method,
      params
    });
  }

  async initialize() {
    await this.request("initialize", buildInitializeParams());
    this.notify("notifications/initialized");
  }

  async listTools(): Promise<McpToolDefinition[]> {
    const tools: McpToolDefinition[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.request("tools/list", cursor ? { cursor } : undefined);
      tools.push(...(((result.tools as McpToolDefinition[] | undefined) ?? []).map((entry) => entry)));
      cursor = typeof result.nextCursor === "string" ? result.nextCursor : undefined;
    } while (cursor);

    return tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    return (await this.request("tools/call", {
      name,
      arguments: args
    })) as McpToolResult;
  }

  async close() {
    this.proc.stdin.end();
    if (!this.proc.killed) {
      this.proc.kill("SIGTERM");
    }
  }
}

function parseSseMessages(payload: string): JsonRpcResponse[] {
  const messages: JsonRpcResponse[] = [];
  let eventData: string[] = [];

  for (const line of payload.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      eventData.push(line.slice(5).trimStart());
      continue;
    }

    if (line === "" && eventData.length > 0) {
      const data = eventData.join("\n");
      eventData = [];
      if (!data || data === "[DONE]") {
        continue;
      }

      try {
        messages.push(JSON.parse(data) as JsonRpcResponse);
      } catch {
        // Ignore malformed event payloads.
      }
    }
  }

  if (eventData.length > 0) {
    try {
      messages.push(JSON.parse(eventData.join("\n")) as JsonRpcResponse);
    } catch {
      // Ignore malformed trailing event payloads.
    }
  }

  return messages;
}

class HttpMcpClient implements McpSession {
  readonly server: ImportedMcpDocument;
  private nextId = 1;
  private sessionId?: string;

  constructor(server: ImportedMcpDocument) {
    if (!server.url) {
      throw new Error(`${server.name} is missing an endpoint URL.`);
    }

    this.server = server;
  }

  private async postMessage(
    message: JsonRpcRequest,
    expectResponse: boolean
  ): Promise<Record<string, unknown>> {
    const response = await fetch(this.server.url!, {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
        ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
        ...(this.server.headers ?? {})
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    const nextSessionId = response.headers.get("mcp-session-id") ?? response.headers.get("Mcp-Session-Id");
    if (nextSessionId) {
      this.sessionId = nextSessionId;
    }

    if (!expectResponse) {
      if (response.status >= 400) {
        throw new Error(`${this.server.name} rejected ${message.method} with ${response.status}.`);
      }

      return {};
    }

    if (!response.ok) {
      throw new Error(`${this.server.name} responded with ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      const events = parseSseMessages(await response.text());
      const match = events.find((event) => event.id === message.id);
      if (!match) {
        throw new Error(`${this.server.name} returned no matching response for ${message.method}.`);
      }

      return extractJsonRpcResult(match);
    }

    const payload = (await response.json()) as JsonRpcResponse;
    return extractJsonRpcResult(payload);
  }

  async initialize() {
    await this.postMessage(
      {
        jsonrpc: "2.0",
        id: this.nextId++,
        method: "initialize",
        params: buildInitializeParams()
      },
      true
    );

    await this.postMessage(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized"
      },
      false
    );
  }

  async listTools(): Promise<McpToolDefinition[]> {
    const tools: McpToolDefinition[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.postMessage(
        {
          jsonrpc: "2.0",
          id: this.nextId++,
          method: "tools/list",
          params: cursor ? { cursor } : undefined
        },
        true
      );

      tools.push(...(((result.tools as McpToolDefinition[] | undefined) ?? []).map((entry) => entry)));
      cursor = typeof result.nextCursor === "string" ? result.nextCursor : undefined;
    } while (cursor);

    return tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    return (await this.postMessage(
      {
        jsonrpc: "2.0",
        id: this.nextId++,
        method: "tools/call",
        params: {
          name,
          arguments: args
        }
      },
      true
    )) as McpToolResult;
  }

  async close() {
    if (!this.sessionId) {
      return;
    }

    try {
      await fetch(this.server.url!, {
        method: "DELETE",
        headers: {
          "Mcp-Session-Id": this.sessionId,
          "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
          ...(this.server.headers ?? {})
        },
        signal: AbortSignal.timeout(5_000)
      });
    } catch {
      // Best-effort cleanup only.
    }
  }
}

async function createSession(server: ImportedMcpDocument): Promise<McpSession> {
  if (server.transport === "stdio") {
    const session = new StdioMcpClient(server);
    await session.initialize();
    return session;
  }

  if (server.transport === "http") {
    const session = new HttpMcpClient(server);
    await session.initialize();
    return session;
  }

  throw new Error(`${server.transport} transport is not executable yet.`);
}

export async function buildMcpToolRuntime(selectedMcps: ImportedMcpDocument[]): Promise<BuildRuntimeResult> {
  const tools: BuildRuntimeResult["tools"] = {};
  const warnings: string[] = [];
  const catalog: BuildRuntimeResult["catalog"] = [];
  const sessions: McpSession[] = [];

  for (const server of selectedMcps) {
    if (!isExecutableTransport(server.transport)) {
      warnings.push(`${server.name}: ${server.transport} transport is not executable yet.`);
      continue;
    }

    try {
      const session = await createSession(server);
      const definitions = await session.listTools();

      if (definitions.length === 0) {
        warnings.push(`${server.name}: no tools were exposed by the server.`);
        await session.close();
        continue;
      }

      sessions.push(session);

      definitions.forEach((definition) => {
        const toolKey = sanitizeToolKey(server.name, definition.name);
        const title = definition.title ?? definition.annotations?.title ?? definition.name;
        const description = formatToolDescription(server, definition);

        catalog.push({
          serverId: server.id,
          serverName: server.name,
          toolKey,
          toolName: definition.name,
          title,
          description,
          transport: server.transport
        });

        tools[toolKey] = tool({
          description,
          inputSchema: z.object({}).passthrough(),
          execute: async (input) => {
            try {
              const result = await session.callTool(definition.name, input);
              return normalizeToolResult(server, definition.name, result);
            } catch (error) {
              return {
                server: server.name,
                tool: definition.name,
                isError: true,
                content: [],
                error: error instanceof Error ? error.message : "Tool execution failed."
              };
            }
          }
        });
      });
    } catch (error) {
      warnings.push(
        `${server.name}: ${error instanceof Error ? error.message : "Failed to initialize MCP runtime."}`
      );
    }
  }

  return {
    tools,
    warnings,
    catalog,
    close: async () => {
      await Promise.allSettled(sessions.map((session) => session.close()));
    }
  };
}
