import { randomUUID } from "node:crypto";

import { headers } from "next/headers";

import type Stripe from "stripe";

import { recordPurchase } from "@/lib/purchases";
import { recordBillingEvent, upsertSubscription } from "@/lib/system-state";
import { toBillingEventRecord, toSubscriptionRecord, verifyWebhookSignature } from "@/lib/stripe";
import { withApiUsage } from "@/lib/usage-server";

function isSkillPurchase(session: Stripe.Checkout.Session): boolean {
  return session.mode === "payment" && session.metadata?.type === "skill_purchase";
}

async function handleSkillPurchase(session: Stripe.Checkout.Session): Promise<void> {
  const clerkUserId = session.metadata?.clerkUserId;
  const skillSlug = session.metadata?.skillSlug;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "";

  if (!clerkUserId || !skillSlug) return;

  await recordPurchase({
    id: randomUUID(),
    clerkUserId,
    skillSlug,
    stripePaymentIntentId: paymentIntentId,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    purchasedAt: new Date().toISOString()
  });
}

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

        try {
          await recordBillingEvent(toBillingEventRecord(event));
        } catch (billingError) {
          console.error("[stripe] Failed to record billing event:", billingError);
        }

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;

            if (isSkillPurchase(session)) {
              await handleSkillPurchase(session);
            } else {
              const record = toSubscriptionRecord(session, updatedAt);
              if (record) {
                await upsertSubscription(record);
              }
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
