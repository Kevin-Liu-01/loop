import { revalidatePath } from "next/cache";

import { runWeeklyImport } from "@/lib/weekly-import";
import { sendWeeklyDigest } from "@/lib/email/weekly-digest";
import { withApiUsage } from "@/lib/usage-server";

export const maxDuration = 300;

export async function GET(request: Request) {
  return withApiUsage(
    { route: "/api/cron/weekly-import", method: "GET", label: "Weekly import cron" },
    async () => {
      const authHeader = request.headers.get("authorization");
      const expected = process.env.CRON_SECRET;
      if (!expected || authHeader !== `Bearer ${expected}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const result = await runWeeklyImport();

      if (result.imported.length > 0) {
        try {
          revalidatePath("/");
          revalidatePath("/skills/new");
        } catch (revalidateError) {
          console.error("[weekly-import] Cache revalidation failed:", revalidateError);
        }

        try {
          await sendWeeklyDigest(result);
        } catch (emailError) {
          console.error("[weekly-import] Email digest failed:", emailError);
        }
      }

      return Response.json({
        ok: true,
        imported: result.imported.length,
        skipped: result.skipped.length,
        errors: result.errors.length,
        details: result,
      });
    }
  );
}
