import { redirect } from "next/navigation";

import { settingsPath } from "@/lib/settings-nav";

export default function SettingsIndexPage() {
  redirect(settingsPath("skills"));
}
