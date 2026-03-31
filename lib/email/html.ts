import { EMAIL_FROM } from "@/lib/email/client";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.so";
export const BRAND_NAME = "Loop";
export const BRAND_COLOR = "#e8650a";
export const BRAND_COLOR_HOVER = "#ff7a1a";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <title>${BRAND_NAME}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;-webkit-text-size-adjust:100%;background-color:#0a0a0c;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0c;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
          ${brandHeader()}
          ${bodyContent}
          ${brandFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function brandHeader(): string {
  return `<tr>
  <td style="padding:0 0 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:28px;height:28px;background-color:${BRAND_COLOR};border-radius:7px;" valign="middle" align="center">
          <span style="font-size:15px;font-weight:700;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">L</span>
        </td>
        <td style="padding-left:10px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:500;color:#e5e5e5;letter-spacing:-0.02em;">
          ${BRAND_NAME}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function brandFooter(): string {
  return `<tr>
  <td style="padding:32px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-top:1px solid #1e1e24;padding:20px 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:16px;">
                <a href="${SITE_URL}" style="font-size:12px;color:#6b6b78;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Skills</a>
              </td>
              <td style="padding-right:16px;">
                <a href="${SITE_URL}/settings" style="font-size:12px;color:#6b6b78;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Settings</a>
              </td>
              <td>
                <a href="${SITE_URL}/settings" style="font-size:12px;color:#6b6b78;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Preferences</a>
              </td>
            </tr>
          </table>
          <p style="margin:12px 0 0;font-size:11px;color:#44444e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            Sent by ${escapeHtml(EMAIL_FROM.replace(/<.*>/, "").trim())} · <a href="${SITE_URL}/settings" style="color:#6b6b78;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

export function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0;">
  <tr>
    <td style="background-color:${BRAND_COLOR};border-radius:8px;padding:12px 28px;">
      <a href="${href}" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function secondaryButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0;">
  <tr>
    <td style="border:1px solid #2a2a32;border-radius:8px;padding:10px 22px;">
      <a href="${href}" style="font-size:13px;font-weight:500;color:#a0a0ab;text-decoration:none;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function sectionHeading(text: string): string {
  return `<tr>
  <td style="padding:0 0 12px;">
    <h2 style="margin:0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#6b6b78;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(text)}</h2>
  </td>
</tr>`;
}

export function divider(): string {
  return `<tr><td style="padding:24px 0;"><div style="height:1px;background-color:#1e1e24;"></div></td></tr>`;
}

export function categoryBadge(category: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:#1e1e24;font-size:11px;font-weight:500;color:#a0a0ab;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.02em;">${escapeHtml(category)}</span>`;
}
