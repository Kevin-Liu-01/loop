import type { MetadataRoute } from "next";

import { buildSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: buildSiteUrl("/sitemap.xml").toString(),
  };
}
