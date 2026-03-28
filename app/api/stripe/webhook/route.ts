import { headers } from "next/headers";

import { recordBillingEvent, upsertSubscription } from "@/lib/system-state";
import { toBillingEventRecord, toSubscriptionRecord, verifyWebhookSignature } from "@/lib/stripe";
import { withApiUsage } from "@/lib/usage-server";

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/stripe/webhook",
      method: "POST",
      label: "Stripe webhook"
    },
    async () => {
      const payload = await request.text();
      const signature = (await headers()).get("stripe-signature");

      if (!signature) {
        return Response.json({ error: "Missing stripe-signature header." }, { status: 400 });
      }

      try {
        const event = verifyWebhookSignature(payload, signature);
        const updatedAt = new Date(event.created * 1000).toISOString();

        await recordBillingEvent(toBillingEventRecord(event));

        switch (event.type) {
          case "checkout.session.completed": {
            const record = toSubscriptionRecord(event.data.object, updatedAt);
            if (record) {
              await upsertSubscription(record);
            }
            break;
          }
          case "customer.subscription.created":
          case "customer.subscription.updated":
          case "customer.subscription.deleted": {
            const record = toSubscriptionRecord(event.data.object, updatedAt);
            if (record) {
              await upsertSubscription(record);
            }
            break;
          }
          case "invoice.paid":
          case "invoice.payment_failed":
          default:
            break;
        }

        return Response.json({ received: true });
      } catch (error) {
        return Response.json(
          {
            error: error instanceof Error ? error.message : "Webhook verification failed."
          },
          { status: 400 }
        );
      }
    }
  );
}
