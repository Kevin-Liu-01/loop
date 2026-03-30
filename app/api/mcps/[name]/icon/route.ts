import { requireAuth, authErrorResponse } from "@/lib/auth";
import { getAuthorizedAdminEmail } from "@/lib/admin";
import { uploadIcon, validateIconFile, updateMcpIconUrl } from "@/lib/icon-storage";
import { listMcps } from "@/lib/db/mcps";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await requireAuth();
    const { name } = await params;

    const isAdmin = getAuthorizedAdminEmail(request) !== null;
    if (!isAdmin) {
      return Response.json(
        { error: "Only an admin can change MCP icons." },
        { status: 403 }
      );
    }

    const mcps = await listMcps();
    const mcp = mcps.find((m) => m.name === name);
    if (!mcp) {
      return Response.json({ error: "MCP not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("icon") as File | null;
    if (!file) {
      return Response.json({ error: "Missing 'icon' file field." }, { status: 400 });
    }

    const validationError = validateIconFile(file);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { publicUrl } = await uploadIcon("mcps", name, file);
    await updateMcpIconUrl(name, publicUrl);

    return Response.json({ ok: true, iconUrl: publicUrl });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    console.error("[mcp-icon] Upload failed:", error);
    return Response.json(
      { error: "Icon upload failed." },
      { status: 500 }
    );
  }
}
