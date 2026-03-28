import { createHash } from "node:crypto";

import type { SkillHeading } from "@/lib/types";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHeadings(markdown: string): SkillHeading[] {
  return markdown
    .split("\n")
    .map((line) => {
      const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());
      if (!match) {
        return null;
      }

      return {
        depth: match[1].length,
        title: match[2].trim(),
        anchor: slugify(match[2])
      } satisfies SkillHeading;
    })
    .filter((entry): entry is SkillHeading => entry !== null);
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---/, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createExcerpt(markdown: string, maxLength = 220): string {
  const plain = stripMarkdown(markdown);
  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function stableHash(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}
