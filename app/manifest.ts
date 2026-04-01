import type { MetadataRoute } from "next";

import { SEO_DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – Operator Desk`,
    short_name: SITE_NAME,
    description: SEO_DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    theme_color: "#0a0a09",
    background_color: "#0a0a09",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
