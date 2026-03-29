import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { CommandPalette } from "@/components/command-palette";
import { NewSkillModal } from "@/components/new-skill-modal";
import "@/app/globals.css";
import { getSkillwireSnapshot } from "@/lib/refresh";

export const metadata: Metadata = {
  title: "Loop",
  description:
    "Loop turns your agent playbooks, updates, and source scans into a living operator desk that stays current."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const snapshot = await getSkillwireSnapshot();

  const paletteItems = [
    ...snapshot.skills.slice(0, 30).map((skill) => ({
      label: skill.title,
      href: skill.href,
      section: "Skill",
      hint: skill.versionLabel
    })),
    ...snapshot.categories.map((category) => ({
      label: category.title,
      href: `/?category=${category.slug}`,
      section: "Category",
      hint: category.status === "live" ? "Live" : "Seeded"
    })),
    {
      label: "Sandbox",
      href: "/sandbox",
      section: "Action",
      hint: "Agent environment"
    },
    {
      label: "Settings",
      href: "/settings",
      section: "Action",
      hint: "Ops"
    }
  ];

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <CommandPalette items={paletteItems} />
        <NewSkillModal categories={snapshot.categories} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
