import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "loop-admin-session";

const DEFAULT_ADMIN_EMAILS = ["kk23907751@gmail.com"];
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAdminEmails(): string[] {
  const configured = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((value) => normalizeAdminEmail(value))
    .filter(Boolean);

  return Array.from(new Set(configured && configured.length > 0 ? configured : DEFAULT_ADMIN_EMAILS));
}

export function getPrimaryAdminEmail(): string {
  return getAdminEmails()[0] ?? DEFAULT_ADMIN_EMAILS[0];
}

function getAdminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.CRON_SECRET ?? "loop-admin-local-session";
}

function signPayload(payload: string): Buffer {
  return createHmac("sha256", getAdminSessionSecret()).update(payload).digest();
}

function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const entries = cookieHeader.split(";").map((entry) => entry.trim());
  for (const entry of entries) {
    if (!entry.startsWith(`${name}=`)) {
      continue;
    }

    return decodeURIComponent(entry.slice(name.length + 1));
  }

  return null;
}

export function createAdminSessionToken(email: string, now = Date.now()): string {
  const normalizedEmail = normalizeAdminEmail(email);
  if (!getAdminEmails().includes(normalizedEmail)) {
    throw new Error("This email is not allowed to claim admin access.");
  }

  const body = Buffer.from(
    JSON.stringify({
      email: normalizedEmail,
      exp: now + SESSION_TTL_MS
    } satisfies AdminSessionPayload)
  ).toString("base64url");

  const signature = signPayload(body).toString("base64url");
  return `${body}.${signature}`;
}

export function readAdminSessionToken(token: string | null | undefined, now = Date.now()): AdminSessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signPayload(body);
  const suppliedSignature = Buffer.from(signature, "base64url");

  if (expectedSignature.length !== suppliedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, suppliedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSessionPayload;
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp <= now) {
      return null;
    }

    const normalizedEmail = normalizeAdminEmail(payload.email);
    if (!getAdminEmails().includes(normalizedEmail)) {
      return null;
    }

    return {
      email: normalizedEmail,
      exp: payload.exp
    };
  } catch {
    return null;
  }
}

export function getAdminEmailFromSessionToken(token: string | null | undefined, now = Date.now()): string | null {
  return readAdminSessionToken(token, now)?.email ?? null;
}

export function getAdminEmailFromCookieHeader(cookieHeader: string | null, now = Date.now()): string | null {
  return getAdminEmailFromSessionToken(parseCookieValue(cookieHeader, ADMIN_SESSION_COOKIE), now);
}

export function getAuthorizedAdminEmail(request: Request, now = Date.now()): string | null {
  return getAdminEmailFromCookieHeader(request.headers.get("cookie"), now);
}
