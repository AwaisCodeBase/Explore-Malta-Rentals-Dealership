import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TermsPageContent } from "./terms-page-content";

type TermsPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("termsTitle"),
    description: t("termsDescription"),
    openGraph: {
      title: t("termsTitle"),
      description: t("termsDescription"),
      locale,
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="pt-[var(--site-header-offset)]">
      <TermsPageContent />
    </div>
  );
}
