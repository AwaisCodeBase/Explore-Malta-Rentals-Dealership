import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type PrivacyPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    openGraph: {
      title: t("privacyTitle"),
      description: t("privacyDescription"),
      locale,
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PrivacyPage");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-[calc(var(--site-header-offset)+3rem)] pb-20 sm:px-6 sm:pt-[calc(var(--site-header-offset)+4rem)] sm:pb-24 lg:px-8 lg:pb-32">
      <p className="type-eyebrow text-orange-600">{t("legalKicker")}</p>
      <h1 className="type-h1 mt-3 text-[var(--text-primary)]">{t("title")}</h1>
      <hr className="rule-fade mt-6" />
      <p className="type-lead mt-6">{t("body")}</p>
      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-semibold text-[var(--text-primary)] underline decoration-orange-400/45 underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-orange-600 hover:decoration-orange-400"
      >
        {t("backToHome")}
      </Link>
    </main>
  );
}
