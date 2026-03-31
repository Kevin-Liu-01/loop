/**
 * Route segments and labels for settings sub-pages (`/settings/[segment]`).
 */
export const SETTINGS_NAV_ITEMS = [
  { id: "automations", label: "Automations" },
  { id: "health", label: "System health" },
  { id: "refresh", label: "Refresh" },
  { id: "imports", label: "Imports" },
  { id: "subscription", label: "Subscription" },
  { id: "connect", label: "Stripe Connect" },
] as const;

export type SettingsNavId = (typeof SETTINGS_NAV_ITEMS)[number]["id"];

export const SETTINGS_BASE_PATH = "/settings" as const;

export function settingsPath(id: SettingsNavId): string {
  return `${SETTINGS_BASE_PATH}/${id}`;
}
