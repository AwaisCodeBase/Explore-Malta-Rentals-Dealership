import { GoogleMapEmbed } from "@/components/google-map-embed";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/features/home/components/section-header";
import { getEnvValue } from "@/components/footer/footer-utils";
import { SITE_CONTACT, SITE_GOOGLE_MAPS_URL } from "@/lib/site-brand-copy";
import { getTranslations } from "next-intl/server";

export async function ContactSection() {
  const t = await getTranslations("Contact");
  const tCommon = await getTranslations("Common");

  const phoneRaw =
    getEnvValue("phone", "NEXT_PUBLIC_PHONE", "telephone") ?? SITE_CONTACT.phone;
  const address = getEnvValue("address") ?? SITE_CONTACT.address;
  const email = getEnvValue("email") ?? SITE_CONTACT.email;
  const telHref = `tel:${phoneRaw.replace(/[^\d+]/g, "")}`;
  const mailHref = `mailto:${email}`;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="scroll-mt-28 border-t border-slate-200/70 bg-white py-16"
    >
      <Container>
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            title={t("title")}
            titleId="contact-title"
            description={t("description")}
            tone="light"
            align="center"
          />
        </div>

        <div className="mt-10">
          <Reveal className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div className="rounded-md border border-slate-200/90 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(2,6,23,0.12)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {tCommon("mobile")}
                </p>
                <a
                  href={telHref}
                  className="mt-2 block text-2xl font-bold tracking-tight text-slate-950 transition-colors hover:text-[var(--brand-orange-strong)] sm:text-3xl"
                >
                  {phoneRaw}
                </a>
                <p className="mt-2 text-sm text-slate-600">{tCommon("tapToCall")}</p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {tCommon("email")}
                </p>
                <a
                  href={mailHref}
                  className="mt-2 block text-base font-semibold text-slate-900 underline decoration-[var(--brand-orange)]/45 underline-offset-4 transition-colors hover:text-[var(--brand-orange-strong)] hover:decoration-[var(--brand-orange)]"
                >
                  {email}
                </a>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {tCommon("address")}
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">{address}</p>
                <a
                  href={SITE_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline decoration-[var(--brand-orange)]/45 underline-offset-4 transition-colors hover:text-[var(--brand-orange-strong)] hover:decoration-[var(--brand-orange)]"
                >
                  {tCommon("openInMaps")}
                </a>
              </div>
            </div>

            <div className="flex min-h-[320px] flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-[0_18px_50px_-35px_rgba(2,6,23,0.12)] lg:min-h-0">
              <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {tCommon("location")}
              </p>
              <GoogleMapEmbed
                className="min-h-[280px] w-full flex-1 lg:min-h-0"
                query={address}
              />
            </div>
          </Reveal>

          <Reveal as="div" delay={120} className="mt-6 rounded-md border border-slate-200/90 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(2,6,23,0.08)]">
            <p className="text-sm font-semibold text-slate-950">{tCommon("responseTimeTitle")}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{tCommon("responseTimeBody")}</p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
