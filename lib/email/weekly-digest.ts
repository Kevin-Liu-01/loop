import { EMAIL_FROM, getResendClient } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/admin";
import {
  siteUrl,
  emailWrapper,
  escapeHtml,
  ctaButton,
  sectionHeading,
  divider,
  categoryBadge,
} from "@/lib/email/html";
import type { WeeklyImportResult, ImportedSkillSummary } from "@/lib/weekly-import";

function skillCard(skill: ImportedSkillSummary): string {
  const href = `${siteUrl()}/skills/${skill.slug}/v1`;
  const desc =
    skill.description.length > 100
      ? `${skill.description.slice(0, 100)}…`
      : skill.description;

  return `<tr>
  <td style="padding:12px 16px;background-color:#13131a;border-radius:10px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <a href="${href}" style="font-size:15px;font-weight:600;color:#e5e5e5;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            ${escapeHtml(skill.title)}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0 0;">
          ${categoryBadge(skill.category)}
          <span style="font-size:12px;color:#6b6b78;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding-left:6px;">
            from ${escapeHtml(skill.sourceName)}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0 0;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#8b8b96;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(desc)}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr><td style="height:8px;"></td></tr>`;
}

function statBlock(value: string, label: string): string {
  return `<td style="text-align:center;padding:12px 16px;background-color:#13131a;border-radius:8px;">
  <div style="font-size:22px;font-weight:700;color:#e5e5e5;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.02em;">${escapeHtml(value)}</div>
  <div style="font-size:11px;color:#6b6b78;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-transform:uppercase;letter-spacing:0.06em;padding-top:4px;">${escapeHtml(label)}</div>
</td>`;
}

function buildDigestHtml(result: WeeklyImportResult): string {
  const importedCount = result.imported.length;
  const errorCount = result.errors.length;
  const skillRows = result.imported.map(skillCard).join("");

  const statsRow = `<tr>
  <td style="padding:0 0 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${statBlock(String(importedCount), importedCount === 1 ? "Skill added" : "Skills added")}
        <td style="width:8px;"></td>
        ${statBlock(String(result.skipped.length), "Skipped")}
        <td style="width:8px;"></td>
        ${statBlock(errorCount > 0 ? String(errorCount) : "0", "Errors")}
      </tr>
    </table>
  </td>
</tr>`;

  const heroSection = `<tr>
  <td style="padding:0 0 8px;">
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#e5e5e5;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.03em;">
      Weekly Digest
    </h1>
    <p style="margin:8px 0 0;font-size:14px;color:#8b8b96;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      ${importedCount} new skill${importedCount !== 1 ? "s" : ""} imported this week from trusted sources.
    </p>
  </td>
</tr>`;

  const skillSection =
    importedCount > 0
      ? `${sectionHeading("New skills")}
<tr>
  <td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${skillRows}
    </table>
  </td>
</tr>`
      : "";

  const errorNote =
    errorCount > 0
      ? `<tr><td style="padding:8px 0 0;"><p style="margin:0;font-size:12px;color:#6b6b78;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${errorCount} import${errorCount !== 1 ? "s" : ""} had errors and were skipped.</p></td></tr>`
      : "";

  const ctaRow = `<tr>
  <td style="padding:8px 0 0;" align="center">
    ${ctaButton(siteUrl(), "Browse catalog")}
  </td>
</tr>`;

  return emailWrapper(
    `${heroSection}${divider()}${statsRow}${divider()}${skillSection}${errorNote}${divider()}${ctaRow}`
  );
}

function buildDigestText(result: WeeklyImportResult): string {
  const lines = [
    "Loop Weekly Digest",
    "==================",
    "",
    `${result.imported.length} new skill${result.imported.length !== 1 ? "s" : ""} imported this week`,
    `${result.skipped.length} skipped · ${result.errors.length} errors`,
    "",
  ];

  const base = siteUrl();

  if (result.imported.length > 0) {
    lines.push("NEW SKILLS");
    lines.push("----------");
    for (const skill of result.imported) {
      lines.push(`  ${skill.title} [${skill.category}]`);
      lines.push(`  from ${skill.sourceName}`);
      lines.push(`  ${skill.description.slice(0, 100)}`);
      lines.push(`  ${base}/skills/${skill.slug}/v1`);
      lines.push("");
    }
  }

  if (result.errors.length > 0) {
    lines.push(
      `${result.errors.length} import(s) had errors and were skipped.`,
      ""
    );
  }

  lines.push(`Browse catalog: ${base}`);
  lines.push(`Manage preferences: ${base}/settings`);
  return lines.join("\n");
}

export async function sendWeeklyDigest(
  result: WeeklyImportResult
): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set – skipping weekly digest");
    return;
  }

  if (result.imported.length === 0) return;

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return;

  const subject = `Loop digest: ${result.imported.length} new skill${result.imported.length !== 1 ? "s" : ""} this week`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: adminEmails,
    subject,
    html: buildDigestHtml(result),
    text: buildDigestText(result),
  });
}
