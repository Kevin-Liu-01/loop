import { NextResponse } from "next/server";

import { z } from "zod";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getPrimaryAdminEmail,
  normalizeAdminEmail
} from "@/lib/admin";
import { withApiUsage } from "@/lib/usage-server";

const claimSchema = z.object({
  email: z.string().email()
});

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/admin/session",
      method: "POST",
      label: "Claim admin session"
    },
    async () => {
      try {
        const payload = claimSchema.parse(await request.json());
        const email = normalizeAdminEmail(payload.email);
        const token = createAdminSessionToken(email);

        const response = NextResponse.json({
          ok: true,
          email
        });

        response.cookies.set({
          name: ADMIN_SESSION_COOKIE,
          value: token,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: SESSION_TTL_SECONDS
        });

        return response;
      } catch {
        return NextResponse.json(
          {
            error: `Only the configured admin email can claim operator access. Current allowlist lead: ${getPrimaryAdminEmail()}.`
          },
          { status: 403 }
        );
      }
    }
  );
}

export async function DELETE() {
  return withApiUsage(
    {
      route: "/api/admin/session",
      method: "DELETE",
      label: "Clear admin session"
    },
    async () => {
      const response = NextResponse.json({ ok: true });
      response.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(0)
      });
      return response;
    }
  );
}
