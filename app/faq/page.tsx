import type { Metadata } from "next";

import { AppGridShell } from "@/components/app-grid-shell";
import { FaqShell } from "@/components/faq-shell";
import { SiteHeader } from "@/components/site-header";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader, PageHeaderLead, PageHeaderSub, PageHeaderTitle } from "@/components/ui/page-header";
import { FAQ_SECTIONS } from "@/lib/faq-data";
import { pageInsetColumnClass } from "@/lib/ui-layout";
import {
  buildDefaultOpenGraphImages,
  buildDefaultTwitterImageUrls,
  buildSiteUrl,
  SITE_NAME,
} from "@/lib/seo";

const FAQ_TITLE = "FAQ";
const FAQ_DESCRIPTION =
  "Frequently asked questions about Loop – the operator desk for self-updating agent skills.";

export const metadata: Metadata = {
  title: FAQ_TITLE,
  description: FAQ_DESCRIPTION,
  openGraph: {
    title: `${FAQ_TITLE} · ${SITE_NAME}`,
    description: FAQ_DESCRIPTION,
    url: buildSiteUrl("/faq").toString(),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: buildDefaultOpenGraphImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${FAQ_TITLE} · ${SITE_NAME}`,
    description: FAQ_DESCRIPTION,
    images: buildDefaultTwitterImageUrls(),
  },
};

export default function FaqPage() {
  return (
    <AppGridShell header={<SiteHeader />}>
      <PageShell inset className="flex min-h-0 flex-1 flex-col">
        <div className={pageInsetColumnClass("grid min-h-0 flex-1 gap-8 overflow-y-auto pb-16")}>
          <PageHeader>
            <PageHeaderLead>
              <PageHeaderTitle>Frequently asked questions</PageHeaderTitle>
              <PageHeaderSub>
                Everything you need to know about Loop – from skills and
                automations to billing and the refresh engine.
              </PageHeaderSub>
            </PageHeaderLead>
          </PageHeader>

          <FaqShell sections={FAQ_SECTIONS} />
        </div>
      </PageShell>
    </AppGridShell>
  );
}
