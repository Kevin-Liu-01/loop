"use client";

import { useEffect } from "react";

import type { CategorySlug, UsageEventKind } from "@/lib/types";

type UsageBeaconProps = {
  kind: Exclude<UsageEventKind, "api_call">;
  label: string;
  path?: string;
  skillSlug?: string;
  categorySlug?: CategorySlug;
  details?: string;
  dedupeKey?: string;
};

type ClientUsagePayload = {
  kind: Exclude<UsageEventKind, "api_call">;
  label: string;
  path?: string;
  skillSlug?: string;
  categorySlug?: CategorySlug;
  details?: string;
};

export function postUsageEvent(payload: ClientUsagePayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/usage", blob);
    return;
  }

  void fetch("/api/usage", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body,
    keepalive: true
  }).catch(() => {});
}

export function UsageBeacon({ dedupeKey, ...payload }: UsageBeaconProps) {
  useEffect(() => {
    if (dedupeKey) {
      const storageKey = `loop.usage.${dedupeKey}`;
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }
      window.sessionStorage.setItem(storageKey, "1");
    }

    postUsageEvent(payload);
  }, [dedupeKey, payload]);

  return null;
}
