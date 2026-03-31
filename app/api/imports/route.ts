import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  buildImportedSkillRecord,
  importRemoteMcps,
  importRemoteSkill,
  listImportedMcps,
  listImportedSkills
} from "@/lib/imports";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

const importSchema = z.object({
  kind: z.enum(["skill", "mcp"]),
  url: z.string().url(),
  sourceName: z.string().optional(),
  sourceIconUrl: z.string().url().optional(),
});

export async function GET() {
  return withApiUsage(
    {
      route: "/api/imports",
      method: "GET",
      label: "List imports"
    },
    async () => {
      const [skills, mcps] = await Promise.all([listImportedSkills(), listImportedMcps()]);

      return Response.json({
        ok: true,
        skills,
        mcps
      });
    }
  );
}

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/imports",
      method: "POST",
      label: "Import remote asset"
    },
    async () => {
      try {
        const payload = importSchema.parse(await request.json());

        if (payload.kind === "skill") {
          const skill = await importRemoteSkill(payload.url, {
            sourceName: payload.sourceName,
            sourceIconUrl: payload.sourceIconUrl,
          });
          const record = buildImportedSkillRecord(skill);

          revalidatePath("/");
          revalidatePath("/agents");
          revalidatePath(`/categories/${skill.category}`);
          revalidatePath(`/skills/${skill.slug}`);
          revalidatePath(record.href);

          await logUsageEvent({
            kind: "skill_import",
            source: "api",
            label: "Imported skill",
            path: record.href,
            skillSlug: skill.slug,
            categorySlug: skill.category,
            details: payload.url
          });

          return Response.json({
            ok: true,
            kind: "skill",
            skill
          });
        }

        const mcps = await importRemoteMcps(payload.url);

        revalidatePath("/");
        revalidatePath("/agents");

        return Response.json({
          ok: true,
          kind: "mcp",
          mcps
        });
      } catch (error) {
        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Import failed." }, { status: 400 });
      }
    }
  );
}
