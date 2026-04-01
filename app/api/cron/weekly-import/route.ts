import { revalidatePath } from "next/cache";

import { refreshLoopSnapshot } from "@/lib/refresh";
import { runWeeklyImport } from "@/lib/weekly-import";
import { sendWeeklyDigest } from "@/lib/email/weekly-digest";
import { withApiUsage } from "@/lib/usage-server";

export const maxDuration = 300;

export async function GET(request: Request) {
  return withApiUsage(
    { route: "/api/cron/weekly-import", method: "GET", label: "Weekly import + refresh cron" },
    async () => {
      const authHeader = request.headers.get("authorization");
      const expected = process.env.CRON_SECRET;
      if (!expected || authHeader !== `Bearer ${expected}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const [importResult, refreshResult] = await Promise.allSettled([
        runWeeklyImport(),
        refreshLoopSnapshot({
          refreshCategorySignals: false,
          refreshUserSkills: true,
          refreshImportedSkills: true,
        }),
      ]);

      const result = importResult.status === "fulfilled" ? importResult.value : null;
      const dispatched = refreshResult.status === "fulfilled"
        ? refreshResult.value.dispatchedSkillCount
        : 0;

      if (importResult.status === "rejected") {
        console.error("[weekly-cron] Import failed:", importResult.reason);
      }
      if (refreshResult.status === "rejected") {
        console.error("[weekly-cron] Refresh failed:", refreshResult.reason);
      }

      if (result && result.imported.length > 0) {
        try {
          revalidatePath("/");
          revalidatePath("/skills/new");
        } catch (revalidateError) {
          console.error("[weekly-cron] Cache revalidation failed:", revalidateError);
        }

        try {
          await sendWeeklyDigest(result);
        } catch (emailError) {
          console.error("[weekly-cron] Email digest failed:", emailError);
        }
      }

      return Response.json({
        ok: true,
        imported: result?.imported.length ?? 0,
        skipped: result?.skipped.length ?? 0,
        errors: result?.errors.length ?? 0,
        dispatchedSkillRefreshes: dispatched,
        details: result,
      });
    }
  );
}
