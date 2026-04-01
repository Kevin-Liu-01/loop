import { EMAIL_FROM, getResendClient } from "@/lib/email/client";
import {
  siteUrl,
  BRAND_NAME,
  emailWrapper,
  escapeHtml,
  ctaButton,
  secondaryButton,
  divider,
} from "@/lib/email/html";

type WelcomeEmailParams = {
  email: string;
  firstName?: string;
};

function actionCard(
  title: string,
  description: string,
  href: string,
  linkText: string
): string {
  return `<tr>
  <td style="padding:12px 16px;background-color:#13131a;border-radius:10px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <span style="font-size:15px;font-weight:600;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(title)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0 0;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#8b8b96;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(description)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0 0;">
          <a href="${href}" style="font-size:13px;font-weight:500;color:#e8650a;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(linkText)} &rarr;</a>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr><td style="height:8px;"></td></tr>`;
}

function buildWelcomeHtml({ firstName }: WelcomeEmailParams): string {
  const greeting = firstName
    ? `Welcome, ${escapeHtml(firstName)}`
    : `Welcome to ${BRAND_NAME}`;

  const heroSection = `<tr>
  <td style="padding:0 0 8px;">
    <h1 style="margin:0;font-size:28px;font-weight:700;color:#e5e5e5;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.03em;">
      ${greeting}
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#8b8b96;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      ${BRAND_NAME} keeps your agent skills sharp. Every playbook stays current,
      every parameter stays optimal &mdash; automatically.
    </p>
  </td>
</tr>`;

  const valuePropSection = `<tr>
  <td style="padding:0 0 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:24px;font-size:14px;color:#e8650a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" valign="top">&bull;</td>
              <td style="font-size:14px;color:#a0a0ab;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <strong style="color:#e5e5e5;">Continuous monitoring</strong> &mdash; sources are watched and skills update when the world changes
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:24px;font-size:14px;color:#e8650a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" valign="top">&bull;</td>
              <td style="font-size:14px;color:#a0a0ab;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <strong style="color:#e5e5e5;">Reviewable diffs</strong> &mdash; every change is eval-gated and visible before it ships
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:24px;font-size:14px;color:#e8650a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" valign="top">&bull;</td>
              <td style="font-size:14px;color:#a0a0ab;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <strong style="color:#e5e5e5;">MCP integration</strong> &mdash; connect any server, wire tools, version everything alongside skills
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  const base = siteUrl();

  const actionsSection = `<tr>
  <td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${actionCard("Browse the skill catalog", "Explore 40+ curated agent skills across frontend, SEO, security, infrastructure, and more.", base, "Open catalog")}
      ${actionCard("Create your first skill", "Build a custom skill with agent docs for Cursor, Codex, Claude, and AGENTS.md.", `${base}/?new=1`, "Start creating")}
      ${actionCard("Discover MCP servers", "Import server definitions from the open ecosystem and wire them into your workflows.", base, "Explore MCPs")}
    </table>
  </td>
</tr>`;

  const ctaRow = `<tr>
  <td align="center" style="padding:8px 0 0;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">${ctaButton(base, "Get started")}</td>
        <td>${secondaryButton(`${base}/settings`, "Settings")}</td>
      </tr>
    </table>
  </td>
</tr>`;

  return emailWrapper(
    `${heroSection}${divider()}${valuePropSection}${divider()}${actionsSection}${divider()}${ctaRow}`
  );
}

function buildWelcomeText({ firstName }: WelcomeEmailParams): string {
  const greeting = firstName ? `Welcome, ${firstName}` : `Welcome to ${BRAND_NAME}`;
  const base = siteUrl();
  return [
    greeting,
    "=".repeat(greeting.length),
    "",
    `${BRAND_NAME} keeps your agent skills sharp. Every playbook stays current,`,
    "every parameter stays optimal – automatically.",
    "",
    "WHAT YOU CAN DO",
    "---------------",
    `  Browse skills:  ${base}`,
    `  Create a skill: ${base}/?new=1`,
    `  Explore MCPs:   ${base}`,
    `  Settings:       ${base}/settings`,
    "",
    "WHY LOOP",
    "--------",
    "  • Continuous monitoring – sources are watched and skills update when the world changes",
    "  • Reviewable diffs – every change is eval-gated and visible before it ships",
    "  • MCP integration – connect any server, wire tools, version everything alongside skills",
    "",
    `Get started: ${base}`,
  ].join("\n");
}

export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set – skipping welcome email");
    return;
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: [params.email],
    subject: `Welcome to ${BRAND_NAME} – your skills, always current`,
    html: buildWelcomeHtml(params),
    text: buildWelcomeText(params),
  });
}
