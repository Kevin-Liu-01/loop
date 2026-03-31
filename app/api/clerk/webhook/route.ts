import { headers } from "next/headers";
import { Webhook } from "svix";

import { sendWelcomeEmail } from "@/lib/email/welcome";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id: string | null;
  };
};

type ClerkWebhookEvent = ClerkUserCreatedEvent | { type: string; data: unknown };

function getWebhookSecret(): string {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) throw new Error("CLERK_WEBHOOK_SECRET is not configured");
  return secret;
}

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  let event: ClerkWebhookEvent;

  try {
    const wh = new Webhook(getWebhookSecret());
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] Verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  if (event.type === "user.created") {
    const { data } = event as ClerkUserCreatedEvent;
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    );
    const email = primaryEmail?.email_address ?? data.email_addresses[0]?.email_address;

    if (email) {
      try {
        await sendWelcomeEmail({
          email,
          firstName: data.first_name ?? undefined,
        });
      } catch (err) {
        console.error("[clerk-webhook] Failed to send welcome email:", err);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
