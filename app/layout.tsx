import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { CommandPalette } from "@/components/command-palette";
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
    {
      label: "Add skill",
      href: "/skills/new",
      section: "Action",
      hint: "Create"
    },
    {
      label: "Agent studio",
      href: "/agents",
      section: "Action",
      hint: "Run"
    },
    {
      label: "Ops",
      href: "/admin",
      section: "Action",
      hint: "Ops"
    },
    ...snapshot.categories.map((category) => ({
      label: category.title,
      href: `/categories/${category.slug}`,
      section: "Category",
      hint: category.status === "live" ? "Live" : "Seeded"
    })),
    ...snapshot.skills.slice(0, 24).map((skill) => ({
      label: skill.title,
      href: skill.href,
      section: "Skill",
      hint: skill.versionLabel
    }))
  ];

  return (
    <html lang="en">
      <body>
        <CommandPalette items={paletteItems} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
