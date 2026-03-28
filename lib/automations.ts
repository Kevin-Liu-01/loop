import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { z } from "zod";

import { slugify } from "@/lib/markdown";
import type { SkillRecord } from "@/lib/types";

const AUTOMATIONS_ROOT = path.join(os.homedir(), ".codex", "automations");

export const automationCadenceSchema = z.enum(["hourly-6", "daily-9", "weekdays-9", "weekly-mon"]);

export const createAutomationInputSchema = z.object({
  name: z.string().trim().min(3).max(80),
  skillSlug: z.string().trim().min(1).max(120),
  cadence: automationCadenceSchema,
  note: z.string().trim().max(240).optional().default(""),
  status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE")
});

export type CreateAutomationInput = z.infer<typeof createAutomationInputSchema>;

function quoteToml(value: string): string {
  return JSON.stringify(value);
}

function renderTomlArray(values: string[]): string {
  return `[${values.map((value) => quoteToml(value)).join(", ")}]`;
}

function cadenceToRRule(cadence: CreateAutomationInput["cadence"]): string {
  switch (cadence) {
    case "hourly-6":
      return "FREQ=HOURLY;INTERVAL=6";
    case "daily-9":
      return "FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0";
    case "weekdays-9":
      return "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0";
    case "weekly-mon":
      return "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0";
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function reserveAutomationId(base: string): Promise<string> {
  const initial = slugify(base) || "loop-automation";
  let candidate = initial;
  let index = 2;

  while (await pathExists(path.join(AUTOMATIONS_ROOT, candidate, "automation.toml"))) {
    candidate = `${initial}-${index}`;
    index += 1;
  }

  return candidate;
}

export function buildAutomationPrompt(
  skill: Pick<SkillRecord, "slug" | "title">,
  note: string
): string {
  const trimmedNote = note.trim();
  const task =
    trimmedNote || `Review recent changes and update ${skill.title} if the guidance needs a new revision.`;

  return `Use $${skill.slug} for this task.\n\n${task}`;
}

export function buildAutomationToml(
  input: CreateAutomationInput,
  skill: Pick<SkillRecord, "slug" | "title">,
  id: string
): string {
  const prompt = buildAutomationPrompt(skill, input.note ?? "");

  return [
    `id = ${quoteToml(id)}`,
    `name = ${quoteToml(input.name)}`,
    `prompt = ${quoteToml(prompt)}`,
    `rrule = ${quoteToml(cadenceToRRule(input.cadence))}`,
    `status = ${quoteToml(input.status)}`,
    `cwds = ${renderTomlArray([process.cwd()])}`
  ].join("\n");
}

export async function createAutomation(
  input: CreateAutomationInput,
  skill: Pick<SkillRecord, "slug" | "title">
): Promise<{
  id: string;
  path: string;
  prompt: string;
  rrule: string;
}> {
  await fs.mkdir(AUTOMATIONS_ROOT, { recursive: true });

  const id = await reserveAutomationId(input.name);
  const automationDir = path.join(AUTOMATIONS_ROOT, id);
  const automationPath = path.join(automationDir, "automation.toml");
  const prompt = buildAutomationPrompt(skill, input.note ?? "");
  const rrule = cadenceToRRule(input.cadence);

  await fs.mkdir(automationDir, { recursive: true });
  await fs.writeFile(automationPath, buildAutomationToml(input, skill, id));

  return {
    id,
    path: automationPath,
    prompt,
    rrule
  };
}
