import { Sandbox } from "@vercel/sandbox";

export type SandboxRuntime = "node24" | "node22" | "python3.13";

export type SandboxSessionInfo = {
  sandboxId: string;
  runtime: SandboxRuntime;
  status: string;
};

const DEFAULT_TIMEOUT_MS = 120_000;

export async function createSandboxSession(
  runtime: SandboxRuntime,
  env?: Record<string, string>
): Promise<SandboxSessionInfo> {
  try {
    const sandbox = await Sandbox.create({
      runtime,
      timeout: DEFAULT_TIMEOUT_MS,
      env
    });

    return {
      sandboxId: sandbox.sandboxId,
      runtime,
      status: sandbox.status
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("403") || msg.includes("forbidden") || msg.includes("Not authorized")) {
      throw new Error(
        "Sandbox auth failed (403). Run `vercel link && vercel env pull` locally, or check your Vercel team permissions."
      );
    }
    throw err;
  }
}

export async function getSandboxInstance(sandboxId: string): Promise<Sandbox> {
  return Sandbox.get({ sandboxId });
}

export async function getSandboxStatus(
  sandboxId: string
): Promise<SandboxSessionInfo | null> {
  try {
    const sandbox = await Sandbox.get({ sandboxId });
    return {
      sandboxId: sandbox.sandboxId,
      runtime: "node24",
      status: sandbox.status
    };
  } catch {
    return null;
  }
}

export async function stopSandboxSession(sandboxId: string): Promise<void> {
  try {
    const sandbox = await Sandbox.get({ sandboxId });
    await sandbox.stop();
  } catch {
    // Already stopped or expired
  }
}
