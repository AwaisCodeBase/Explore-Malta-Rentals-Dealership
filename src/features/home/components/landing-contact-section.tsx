import Image from "next/image";
import { GoogleMapEmbed } from "@/components/google-map-embed";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getEnvValue } from "@/components/footer/footer-utils";
import { LOGO_PATH, SITE_CONTACT } from "@/lib/site-brand-copy";
import { getTranslations } from "next-intl/server";

export async function LandingContactSection() {
  const t = await getTranslations("Contact");
  const tNav = await getTranslations("Nav");

  const phoneRaw =
    getEnvValue("phone", "NEXT_PUBLIC_PHONE", "telephone") ?? SITE_CONTACT.phone;
  const address = getEnvValue("address") ?? SITE_CONTACT.address;
  const email = getEnvValue("email") ?? SITE_CONTACT.email;
  const telHref = `tel:${phoneRaw.replace(/[^\d+]/g, "")}`;
  const mailHref = `mailto:${email}`;

  return (
    <section
      id="contact"
      aria-labelledby="landing-contact-title"
      className="scroll-mt-28 overflow-hidden border-t border-slate-200/70 bg-white"
    >
      <Container className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2
              id="landing-contact-title"
              className="font-display text-3xl font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.65rem]"
            >
              {t("heroTitle")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {t("heroDescription")}
            </p>
            <div className="mt-8">
              <a
                href="#contact-map"
                className="inline-flex min-h-11 items-center justify-center rounded-sm bg-red-600 px-8 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_12px_30px_-12px_rgba(220,38,38,0.55)] transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
              >
                {t("ctaButton")}
              </a>
            </div>
          </Reveal>
        </div>
      </Container>

      <div id="contact-map" className="relative min-h-[28rem] sm:min-h-[32rem] lg:min-h-[36rem]">
        <div className="landing-contact-map absolute inset-0">
          <GoogleMapEmbed className="h-full w-full" showFooterLink={false} draggableCursor />
        </div>

        <Container className="pointer-events-none relative z-10 flex min-h-[28rem] items-center justify-end py-10 sm:min-h-[32rem] sm:py-12 lg:min-h-[36rem]">
          <Reveal className="ml-auto w-full max-w-sm">
            <article className="pointer-events-auto rounded-sm bg-white p-6 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.35)] sm:p-7">
              <div className="mb-5 overflow-hidden rounded-sm">
                <Image
                  src={LOGO_PATH}
                  alt={tNav("logoAlt")}
                  width={320}
                  height={56}
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="h-auto w-full"
                />
              </div>

              <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-950">
                {t("contactDetailsTitle")}
              </h3>

              <address className="mt-4 space-y-3 not-italic text-sm leading-6 text-slate-800">
                <p>{address}</p>
                <p>
                  <a
                    href={telHref}
                    className="font-medium text-slate-900 transition-colors hover:text-[var(--brand-orange-strong)]"
                  >
                    {phoneRaw}
                  </a>
                </p>
                <p>
                  <a
                    href={mailHref}
                    className="font-medium text-slate-900 transition-colors hover:text-[var(--brand-orange-strong)]"
                  >
                    {email}
                  </a>
                </p>
              </address>
            </article>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
