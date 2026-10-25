import { FinalConversionCta } from "@/components/cta/final-conversion-cta";
import {
  splitQuickCtaDescription,
  splitQuickCtaTitle,
} from "@/features/home/lib/quick-cta-copy";
import { getTranslations } from "next-intl/server";

export async function QuickBookingCtaSection() {
  const t = await getTranslations("Home");
  const tBrand = await getTranslations("Brand");

  const title = t("quickCtaTitle");
  const description = t("quickCtaDescription");
  const [titleLine1, titleLine2] = splitQuickCtaTitle(title);
  const { muted, close } = splitQuickCtaDescription(description);
  const aside = `${tBrand("locationKicker")}. ${tBrand("primarySupporting")}`;

  return (
    <FinalConversionCta
      titleId="quick-booking-title"
      titleLines={titleLine2 ? [titleLine1, titleLine2] : [titleLine1]}
      bodyLead={`${t("quickCtaKicker")}.`}
      bodyMuted={muted}
      bodyClose={close}
      aside={aside}
      primaryCta={{ href: "/booking", label: t("quickCtaPrimary") }}
      secondaryCta={{ href: "/#contact", label: t("quickCtaSecondary") }}
    />
  );
}
