import { revalidatePath } from "next/cache";

import { getAuthorizedAdminEmail } from "@/lib/admin";
import { runWeeklyImport } from "@/lib/weekly-import";
import { withApiUsage } from "@/lib/usage-server";

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/admin/imports", method: "POST", label: "Admin manual import" },
    async () => {
      const admin = getAuthorizedAdminEmail(request);
      if (!admin) {
        return Response.json({ error: "Admin access required." }, { status: 403 });
      }

      const result = await runWeeklyImport();

      revalidatePath("/", "layout");
      revalidatePath("/settings/imports", "layout");

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
