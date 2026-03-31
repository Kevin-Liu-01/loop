import type { Metadata } from "next";
import { LandingShell } from "@/components/home-landing/landing-shell";
import {
  LANDING_AUTOMATIONS,
  LANDING_MCPS,
  LANDING_SKILLS,
} from "@/lib/home-landing/landing-data";

export const metadata: Metadata = {
  title: "Loop — Skills that never go stale",
  description:
    "Loop monitors, evaluates, and updates your agent playbooks. Every skill stays optimal, every parameter stays current.",
};

export default function HomePage() {
  return (
    <LandingShell
      automations={LANDING_AUTOMATIONS}
      mcps={LANDING_MCPS}
      skills={LANDING_SKILLS}
    />
  );
}
