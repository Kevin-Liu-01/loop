import { getLoopSnapshot } from "@/lib/refresh";
import { getSiteUrlString } from "@/lib/seo";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const snapshot = await getLoopSnapshot();
  const baseUrl = getSiteUrlString();

  const items = snapshot.dailyBriefs
    .map((brief) => {
      const link = `${baseUrl}/categories/${brief.slug}`;
      return `
        <item>
          <title>${xmlEscape(brief.title)}</title>
          <link>${link}</link>
          <guid>${link}</guid>
          <pubDate>${new Date(brief.generatedAt).toUTCString()}</pubDate>
          <description>${xmlEscape(brief.summary)}</description>
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Loop Daily</title>
      <link>${baseUrl}/</link>
      <description>Daily skill and source briefs generated from local skills and remote watchlists.</description>
      <lastBuildDate>${new Date(snapshot.generatedAt).toUTCString()}</lastBuildDate>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8"
    }
  });
}
