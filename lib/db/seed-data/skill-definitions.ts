import type { CreateSkillInput } from "@/lib/db/skills";

import { frontend } from "@/lib/db/seed-data/skills/frontend";
import { seoGeo } from "@/lib/db/seed-data/skills/seo-geo";
import { social } from "@/lib/db/seed-data/skills/social";
import { infra } from "@/lib/db/seed-data/skills/infra";
import { containers } from "@/lib/db/seed-data/skills/containers";
import { a2a } from "@/lib/db/seed-data/skills/a2a";
import { security } from "@/lib/db/seed-data/skills/security";
import { ops } from "@/lib/db/seed-data/skills/ops";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const SEED_SKILL_DEFINITIONS: SeedSkill[] = [
  ...frontend,
  ...seoGeo,
  ...social,
  ...infra,
  ...containers,
  ...a2a,
  ...security,
  ...ops
];

export function toCreateSkillInput(skill: SeedSkill): CreateSkillInput {
  return {
    ...skill,
    origin: skill.origin ?? "repo"
  };
}
