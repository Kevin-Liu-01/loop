import { notFound, redirect } from "next/navigation";

import { getSkillRecordBySlug } from "@/lib/content";

type SkillPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SkillPage({ params }: SkillPageProps) {
  const { slug } = await params;
  const skill = await getSkillRecordBySlug(slug);
  if (!skill) {
    notFound();
  }

  redirect(skill.href);
}
