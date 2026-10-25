import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PremiumLandingHero } from "@/features/home/components/premium-landing-hero";
import { HeroBookingSection } from "@/features/home/components/hero-booking-section";
import { BikeCategoriesSection } from "@/features/home/components/bike-categories-section";
import { HowItWorksSection } from "@/features/home/components/how-it-works-section";
import { HighlightedServicesSection } from "@/features/home/components/highlighted-services-section";
import { QuickBookingCtaSection } from "@/features/home/components/quick-booking-cta-section";
import { LandingContactSection } from "@/features/home/components/landing-contact-section";
import { FaqSection } from "@/features/home/components/faq-section";
import { HomePageWithPreloader } from "@/features/home/components/home-page-with-preloader";
import { HomePreloaderLayout } from "@/features/home/components/home-preloader-layout";

type HomePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("homeTitle");
  const description = t("defaultDescription");
  return {
    title,
    description,
    openGraph: { title, description, locale },
  };
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <HomePreloaderLayout>
      <HomePageWithPreloader>
        <main className="flex flex-1 flex-col">
          <PremiumLandingHero />
          <HeroBookingSection />
          <BikeCategoriesSection />
          <HowItWorksSection />
          <HighlightedServicesSection />
          <FaqSection />
          <QuickBookingCtaSection />
          <LandingContactSection />
        </main>
      </HomePageWithPreloader>
    </HomePreloaderLayout>
  );
}
