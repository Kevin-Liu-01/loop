import type {
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateStreamEvent,
  LoopUpdateTarget
} from "@/lib/types";

export type StreamLoopCallbacks = {
  onStart: (loop: LoopUpdateTarget) => void;
  onSource: (source: LoopUpdateSourceLog) => void;
  onMessage: (message: string) => void;
  onComplete: (result: LoopUpdateResult, sources: LoopUpdateSourceLog[]) => void;
  onError: (message: string) => void;
};

export function applySourceUpdate(
  current: LoopUpdateSourceLog[],
  next: LoopUpdateSourceLog
): LoopUpdateSourceLog[] {
  if (!current.some((entry) => entry.id === next.id)) {
    return [...current, next];
  }

  return current.map((entry) => (entry.id === next.id ? next : entry));
}

export async function streamLoopUpdate(
  slug: string,
  origin: string,
  callbacks: StreamLoopCallbacks
): Promise<void> {
  const response = await fetch("/api/admin/loops/update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, origin })
  });

  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Unable to start the manual loop update.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as LoopUpdateStreamEvent;
      dispatchStreamEvent(event, callbacks);
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer) as LoopUpdateStreamEvent;
    dispatchStreamEvent(event, callbacks);
  }
}

function dispatchStreamEvent(event: LoopUpdateStreamEvent, callbacks: StreamLoopCallbacks): void {
  switch (event.type) {
    case "start":
      callbacks.onStart(event.loop);
      break;
    case "source":
      callbacks.onSource(event.source);
      break;
    case "analysis":
      callbacks.onMessage(event.message);
      break;
    case "complete":
      callbacks.onComplete(event.result, event.sources);
      break;
    case "error":
      callbacks.onError(event.message);
      break;
  }
}
