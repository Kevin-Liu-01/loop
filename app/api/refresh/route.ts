import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";

import { getSkillCatalogue } from "@/lib/content";
import { refreshLoopSnapshot } from "@/lib/refresh";
import { withApiUsage } from "@/lib/usage-server";

export const maxDuration = 300;

async function isAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (secret && authorization === `Bearer ${secret}`) {
    return true;
  }

  if (!secret && authorization) {
    console.error("[refresh] CRON_SECRET is not set — bearer token auth cannot succeed. Set CRON_SECRET in your environment.");
  }

  const { userId } = await auth();
  return userId !== null;
}

function parseRefreshScope(url: string): {
  refreshCategorySignals: boolean;
  refreshUserSkills: boolean;
  refreshImportedSkills: boolean;
} {
  try {
    const { searchParams } = new URL(url);
    const scope = searchParams.get("scope");

    if (scope === "skills-only") {
      return { refreshCategorySignals: false, refreshUserSkills: true, refreshImportedSkills: true };
    }

    return { refreshCategorySignals: false, refreshUserSkills: true, refreshImportedSkills: true };
  } catch { /* fall through to defaults */ }
  return { refreshCategorySignals: true, refreshUserSkills: true, refreshImportedSkills: true };
}

async function handleRefresh(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = parseRefreshScope(request.url);
  const { dispatchedSkillCount } = await refreshLoopSnapshot(scope);

  const catalogue = await getSkillCatalogue();

  try {
    revalidatePath("/");
    revalidatePath("/agents");
    revalidatePath("/feed.xml");
    revalidatePath("/skills/new");
    catalogue.categories.forEach((category) => revalidatePath(`/categories/${category.slug}`));
    catalogue.skills.forEach((skill) => {
      revalidatePath(`/skills/${skill.slug}`);
      revalidatePath(skill.href);
    });
  } catch (revalidateError) {
    console.error("[refresh] Cache revalidation failed:", revalidateError);
  }

  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    skills: catalogue.skills.length,
    categories: catalogue.categories.length,
    dispatchedSkillRefreshes: dispatchedSkillCount
  });
}

export async function GET(request: Request) {
  return withApiUsage(
    {
      route: "/api/refresh",
      method: "GET",
      label: "Full refresh"
    },
    async () => handleRefresh(request)
  );
}

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/refresh",
      method: "POST",
      label: "Full refresh"
    },
    async () => handleRefresh(request)
  );
}
