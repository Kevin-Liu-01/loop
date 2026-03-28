import { revalidatePath } from "next/cache";

import { getAdminEmailFromCookieHeader } from "@/lib/admin";
import { refreshSkillwireSnapshot } from "@/lib/refresh";
import { withApiUsage } from "@/lib/usage-server";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization === `Bearer ${secret}`) {
    return true;
  }

  return getAdminEmailFromCookieHeader(request.headers.get("cookie")) !== null;
}

async function handleRefresh(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const uploadBlob = url.searchParams.get("mode") === "full";
  const snapshot = await refreshSkillwireSnapshot({
    writeLocal: true,
    uploadBlob
  });

  revalidatePath("/");
  revalidatePath("/agents");
  revalidatePath("/feed.xml");
  revalidatePath("/skills/new");
  snapshot.categories.forEach((category) => revalidatePath(`/categories/${category.slug}`));
  snapshot.skills.forEach((skill) => {
    revalidatePath(`/skills/${skill.slug}`);
    revalidatePath(skill.href);
  });

  return Response.json({
    ok: true,
    generatedAt: snapshot.generatedAt,
    skills: snapshot.skills.length,
    categories: snapshot.categories.length,
    dailyBriefs: snapshot.dailyBriefs.length,
    remoteSnapshotUrl: snapshot.remoteSnapshotUrl ?? null
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
