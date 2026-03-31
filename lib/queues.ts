import { send } from "@vercel/queue";

export const SKILL_REFRESH_TOPIC = "skill-refresh";

export type SkillRefreshMessage = {
  slug: string;
  trigger: "automation" | "manual";
};

export async function publishSkillRefresh(
  slug: string,
  trigger: SkillRefreshMessage["trigger"] = "automation"
): Promise<string | null> {
  const { messageId } = await send(
    SKILL_REFRESH_TOPIC,
    { slug, trigger } satisfies SkillRefreshMessage,
    { idempotencyKey: `${slug}-${new Date().toISOString().slice(0, 10)}` }
  );
  return messageId;
}
