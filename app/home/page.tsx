import type { Metadata } from "next";
import { LandingShell } from "@/components/home-landing/landing-shell";
import { fetchLandingData } from "@/lib/home-landing/landing-queries";
import {
  LANDING_AUTOMATIONS,
  LANDING_MCPS,
  LANDING_SKILLS,
} from "@/lib/home-landing/landing-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loop — Skills that never go stale",
  description:
    "Loop monitors, evaluates, and updates your agent playbooks. Every skill stays optimal, every parameter stays current.",
};

export default async function HomePage() {
  const live = await fetchLandingData().catch(() => null);
  const hasLiveSkills = live && live.skills.length > 0;

  return (
    <LandingShell
      automations={hasLiveSkills ? live.automations : LANDING_AUTOMATIONS}
      mcps={hasLiveSkills ? live.mcps : LANDING_MCPS}
      skills={hasLiveSkills ? live.skills : undefined}
      staticSkills={hasLiveSkills ? undefined : LANDING_SKILLS}
    />
  );
}
