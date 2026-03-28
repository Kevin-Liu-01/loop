import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminSessionToken,
  getAdminEmailFromCookieHeader,
  getAdminEmailFromSessionToken,
  normalizeAdminEmail,
  readAdminSessionToken
} from "@/lib/admin";

test("normalizeAdminEmail trims and lowercases", () => {
  assert.equal(normalizeAdminEmail("  KK23907751@GMAIL.COM "), "kk23907751@gmail.com");
});

test("admin session tokens round-trip the allowlisted operator email", () => {
  const now = Date.parse("2026-03-27T12:00:00.000Z");
  const token = createAdminSessionToken("kk23907751@gmail.com", now);
  const session = readAdminSessionToken(token, now + 1000);

  assert.equal(session?.email, "kk23907751@gmail.com");
  assert.equal(getAdminEmailFromSessionToken(token, now + 1000), "kk23907751@gmail.com");
});

test("expired or tampered admin session tokens are rejected", () => {
  const now = Date.parse("2026-03-27T12:00:00.000Z");
  const token = createAdminSessionToken("kk23907751@gmail.com", now);
  const tampered = `${token}x`;

  assert.equal(readAdminSessionToken(token, now + 1000 * 60 * 60 * 24 * 31), null);
  assert.equal(getAdminEmailFromSessionToken(tampered, now + 1000), null);
});

test("admin email can be read from the cookie header", () => {
  const now = Date.parse("2026-03-27T12:00:00.000Z");
  const token = createAdminSessionToken("kk23907751@gmail.com", now);
  const cookieHeader = `theme=dark; loop-admin-session=${encodeURIComponent(token)}; other=value`;

  assert.equal(getAdminEmailFromCookieHeader(cookieHeader, now + 1000), "kk23907751@gmail.com");
});
