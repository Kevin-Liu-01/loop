import type { DailySignal, SkillUpdateEntry } from "@/lib/types";

function buildSignalLine(item: DailySignal): string {
  return `- ${item.title} (${item.source})`;
}

export function buildUpdateDigest(update?: SkillUpdateEntry | null): string {
  if (!update) {
    return "";
  }

  const sections = [
    `Generated: ${update.generatedAt}`,
    `Summary: ${update.summary}`,
    `What changed: ${update.whatChanged}`,
    `Body changed: ${update.bodyChanged ? "yes" : "no"}`,
    `Editor: ${update.editorModel ?? "unknown"}`
  ];

  if (update.changedSections && update.changedSections.length > 0) {
    sections.push(`Changed sections: ${update.changedSections.join(", ")}`);
  }

  if (update.experiments.length > 0) {
    sections.push("Experiments:");
    sections.push(...update.experiments.map((experiment) => `- ${experiment}`));
  }

  if (update.items.length > 0) {
    sections.push("Signals:");
    sections.push(...update.items.slice(0, 5).map(buildSignalLine));
  }

  return sections.join("\n");
}
