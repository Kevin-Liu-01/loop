import { AGENT_PROVIDER_PRESETS, listGatewayModels } from "@/lib/agents";
import { withApiUsage } from "@/lib/usage-server";

export async function GET() {
  return withApiUsage(
    {
      route: "/api/models",
      method: "GET",
      label: "List models"
    },
    async () => {
      const gatewayModels = await listGatewayModels();

      return Response.json({
        ok: true,
        presets: AGENT_PROVIDER_PRESETS,
        gatewayModels
      });
    }
  );
}
