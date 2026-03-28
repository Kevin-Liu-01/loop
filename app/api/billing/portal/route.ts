import { NextResponse } from "next/server";

import { createPortalSession } from "@/lib/stripe";
import { withApiUsage } from "@/lib/usage-server";

export async function GET(request: Request) {
  return withApiUsage(
    {
      route: "/api/billing/portal",
      method: "GET",
      label: "Create billing portal session"
    },
    async () => {
      const { searchParams, origin } = new URL(request.url);
      const customerId = searchParams.get("customer");

      if (!customerId) {
        return NextResponse.redirect(new URL("/admin?billing=no-customer", request.url));
      }

      try {
        const portalUrl = await createPortalSession(customerId, origin);
        return NextResponse.redirect(portalUrl);
      } catch {
        return NextResponse.redirect(new URL("/admin?billing=portal-unconfigured", request.url));
      }
    }
  );
}
