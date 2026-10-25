import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GoogleMapEmbed } from "@/components/google-map-embed";
import { Container } from "@/components/ui/container";
import { LOGO_PATH, SITE_GOOGLE_MAPS_URL } from "@/lib/site-brand-copy";
import { FooterBackgroundWordmark } from "./footer-background-wordmark";
import { FooterColumn } from "./footer-column";
import { FooterNewsletterForm } from "./footer-newsletter-form";
import { FooterSocialLinks } from "./footer-social-links";
import { digitsOnlyForWa, getEnvValue, normalizeUrl } from "./footer-utils";

function hasConfiguredSocialLinks() {
  return Boolean(
    normalizeUrl(getEnvValue("facebook")) ||
      normalizeUrl(getEnvValue("Instagram")) ||
      normalizeUrl(getEnvValue("TikTok")) ||
      normalizeUrl(getEnvValue("linkedin", "LinkedIn", "NEXT_PUBLIC_LINKEDIN")) ||
      normalizeUrl(getEnvValue("twitter", "NEXT_PUBLIC_TWITTER", "x", "X")),
  );
}

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tBrand = await getTranslations("Brand");
  const tCommon = await getTranslations("Common");
  const brandName =
    getEnvValue("NEXT_PUBLIC_SITE_NAME", "CompanyName", "businessName") ?? "Explore Malta Rentals";
  const logoSrc = LOGO_PATH;
  const email = getEnvValue("email");
  const address = getEnvValue("address");
  const phoneRaw = getEnvValue("phone", "NEXT_PUBLIC_PHONE", "telephone");
  const whatsappRaw = getEnvValue("whatsapp_number", "NEXT_PUBLIC_WHATSAPP_NUMBER");
  const currentYear = new Date().getFullYear();

  const telHref = phoneRaw ? `tel:${phoneRaw.replace(/[^\d+]/g, "")}` : undefined;
  const waDigits = whatsappRaw ? digitsOnlyForWa(whatsappRaw) : "";

  const exploreLinks = [
    { href: "/", label: t("exploreHome") },
    { href: "/#fleet-preview", label: t("exploreFleet") },
    { href: "/#services", label: t("exploreServices") },
    { href: "/#faq", label: t("exploreFaq") },
  ] as const;

  const companyLinks = [
    { href: "/about", label: t("companyAbout") },
    { href: "/tours", label: t("companyTours") },
    { href: "/contact", label: t("companyContact") },
    { href: "/#services", label: t("companyHow") },
  ] as const;

  const supportLinks = [
    { href: "/#faq", label: t("supportHelp") },
    { href: "/contact", label: t("supportTalk") },
    { href: "/booking", label: t("supportBook") },
  ] as const;

  const legalLinks = [
    { href: "/terms", label: t("legalTerms") },
    { href: "/privacy", label: t("legalPrivacy") },
    { href: "/#faq", label: t("legalCookies") },
  ] as const;

  return (
    <footer
      role="contentinfo"
      className="site-footer relative isolate -mt-px overflow-hidden border-t border-white/10 bg-black pb-[var(--footer-wordmark-height)] text-white"
    >
      <div className="site-footer__backdrop" aria-hidden>
        <div className="site-footer__background" />
        <FooterBackgroundWordmark />
      </div>

      <Container className="relative z-10 pt-14 pb-0 sm:pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              <Image
                src={logoSrc}
                alt={brandName}
                width={300}
                height={52}
                className="h-11 w-auto max-w-full object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                style={{ width: "auto" }}
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
              {tBrand("primaryBody")} {tBrand("primarySupporting")}
            </p>
            {hasConfiguredSocialLinks() ? (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">{t("followUs")}</p>
                <div className="mt-3">
                  <FooterSocialLinks />
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm text-white/45">{t("socialConfigHint")}</p>
            )}
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-2">
            <FooterColumn id="footer-explore" title={t("columnExplore")} links={exploreLinks} />
            <FooterColumn id="footer-company" title={t("columnCompany")} links={companyLinks} />
            <FooterColumn id="footer-support" title={t("columnSupport")} links={supportLinks} />
            <FooterColumn id="footer-legal" title={t("columnLegal")} links={legalLinks} />
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">{t("newsletterTitle")}</p>
            <p className="mt-2 text-sm text-white/65">{t("newsletterLeadIn")}</p>
            <FooterNewsletterForm />

            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">{t("sectionContact")}</p>
              <ul className="mt-4 list-none space-y-3 p-0 text-sm">
                {email ? (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                    >
                      {email}
                    </a>
                  </li>
                ) : null}
                {phoneRaw && telHref ? (
                  <li>
                    <a
                      href={telHref}
                      className="text-xl font-bold tracking-tight text-white transition-colors duration-200 hover:text-[var(--brand-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                    >
                      {phoneRaw}
                    </a>
                  </li>
                ) : null}
                {whatsappRaw && waDigits ? (
                  <li>
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white/80 transition-colors duration-200 hover:text-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {t("whatsappLink")}
                    </a>
                  </li>
                ) : null}
                {address ? <li className="text-white/70 leading-relaxed">{address}</li> : null}
                {!email && !phoneRaw && !whatsappRaw && !address ? (
                  <li className="text-white/50">{t("envContactHint")}</li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-center lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">{t("visitCall")}</p>
            {address ? (
              <p className="mt-3 text-sm leading-relaxed text-white/80">{address}</p>
            ) : (
              <p className="mt-3 text-sm text-white/50">{t("envAddressHint")}</p>
            )}
            <a
              href={SITE_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-orange)] underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {tCommon("openInMaps")}
            </a>
            {phoneRaw && telHref ? (
              <a
                href={telHref}
                className="mt-4 inline-flex text-2xl font-bold tracking-tight text-white transition-colors hover:text-[var(--brand-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:text-3xl"
              >
                {phoneRaw}
              </a>
            ) : null}
          </div>
          <div className="min-h-[200px] lg:col-span-8">
            <GoogleMapEmbed
              query={address}
              muted
              className="h-full min-h-[200px] w-full rounded-xl border border-white/10 sm:min-h-[240px]"
            />
          </div>
        </div>
      </Container>

      <div className="relative z-10 mt-20 border-t border-white/10 sm:mt-24 lg:mt-28">
        <Container className="pt-8 pb-2 sm:pt-10 sm:pb-3">
          <div className="flex flex-col gap-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>{t("copyright", { year: currentYear, brand: brandName })}</p>
            <p className="max-w-prose sm:text-right">{tBrand("primarySupporting")}</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
