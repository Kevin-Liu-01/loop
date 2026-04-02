import { SettingsSectionPage } from "@/components/settings-section-page";
import { BrandAssetsPanel } from "@/components/brand-assets-panel";

export default function SettingsBrandingPage() {
  return (
    <SettingsSectionPage sectionId="branding">
      <BrandAssetsPanel />
    </SettingsSectionPage>
  );
}
