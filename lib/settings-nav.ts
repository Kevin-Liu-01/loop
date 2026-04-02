export type SettingsNavGroup = "general" | "operations" | "billing";

export const SETTINGS_NAV_GROUP_LABELS: Record<SettingsNavGroup, string> = {
  general: "General",
  operations: "Operations",
  billing: "Billing",
};

type SettingsNavItem = {
  readonly id: string;
  readonly label: string;
  readonly group: SettingsNavGroup;
};

/**
 * Route segments and labels for settings sub-pages (`/settings/[segment]`).
 */
export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  { id: "preferences", label: "Preferences", group: "general" },
  { id: "skills", label: "Skills", group: "general" },
  { id: "branding", label: "Logos & brand", group: "general" },
  { id: "automations", label: "Automations", group: "operations" },
  { id: "health", label: "System health", group: "operations" },
  { id: "refresh", label: "Refresh", group: "operations" },
  { id: "imports", label: "Imports", group: "operations" },
  { id: "subscription", label: "Subscription", group: "billing" },
  { id: "connect", label: "Stripe Connect", group: "billing" },
] as const;

export type SettingsNavId = (typeof SETTINGS_NAV_ITEMS)[number]["id"];

/** Group order for rendering. */
export const SETTINGS_NAV_GROUPS: readonly SettingsNavGroup[] = [
  "general",
  "operations",
  "billing",
];

export const SETTINGS_BASE_PATH = "/settings" as const;

export function settingsPath(id: SettingsNavId): string {
  return `${SETTINGS_BASE_PATH}/${id}`;
}
