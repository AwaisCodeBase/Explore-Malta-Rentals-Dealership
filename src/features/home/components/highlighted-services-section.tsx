import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/ui/container";

import { Reveal } from "@/components/ui/reveal";

import { ServiceBenefitCard } from "@/features/home/components/services/service-benefit-card";

import { ServiceHeadlineIconDock } from "@/features/home/components/services/service-headline-icon-dock";

import { servicesHeadlineIcons, servicesHighlights } from "@/features/home/data/home-sections";

import { Link } from "@/i18n/navigation";

import { getTranslations } from "next-intl/server";



const SERVICE_MESSAGE_KEY: Record<(typeof servicesHeadlineIcons)[number], string> = {
  "easy-pickup": "easyPickup",
  helmets: "helmets",
  flexible: "flexible",
  support: "support",
  "hotel-delivery": "hotel",
  "online-booking": "onlineBooking",
  "route-tips": "routeTips",
};



export async function HighlightedServicesSection() {

  const t = await getTranslations("Home");

  const tDynamic = t as unknown as (key: string) => string;



  return (

    <section

      id="services"

      aria-labelledby="services-title"

      className="services-section-edge-glow relative z-10 -mt-14 scroll-mt-28 rounded-t-[2rem] bg-[#E5E5E5] py-14 sm:-mt-16 sm:rounded-t-[2.5rem] sm:py-20 lg:-mt-20 lg:py-24"

    >

      <Container className="relative z-[1] !max-w-6xl !px-12 sm:!px-16 md:!px-20 lg:!px-28 xl:!px-36">

        <Link

          href="/#how-it-works"

          className="inline-flex items-center gap-2 rounded-full bg-[#DCDCDC] px-4 py-2 text-sm font-medium tracking-[-0.01em] text-slate-800 transition-[background-color,transform] duration-300 hover:bg-[#D0D0D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E5E5E5]"

        >

          <span>{t("highlightedServicesHowWeWork")}</span>

          <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />

        </Link>



        <div className="services-display-headline relative mt-10 w-full overflow-visible sm:mt-12 lg:mt-14">

          <p

            id="services-title"

            className="text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.045em] text-slate-950"

          >

            {t("sectionServicesTitleLine1")}

          </p>



          <ServiceHeadlineIconDock
            ariaLabel={t("sectionServicesTitle")}
            items={servicesHeadlineIcons.map((id) => ({
              id,
              label: tDynamic(`services.${SERVICE_MESSAGE_KEY[id]}.title`),
            }))}
          />



          <p className="text-right text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.045em] text-slate-950">

            {t("sectionServicesTitleLine2")}

          </p>

        </div>



        <p className="services-display-body mt-8 max-w-xl text-sm leading-7 text-slate-600 sm:mt-10 sm:text-base sm:leading-8">

          {t("highlightedServicesDescription")}

        </p>



        <ul

          className="mt-12 grid list-none grid-cols-1 gap-5 p-0 sm:mt-14 md:grid-cols-2 md:gap-6 lg:mt-16 lg:gap-7"

          role="list"

        >

          {servicesHighlights.map((item, index) => {

            const key = SERVICE_MESSAGE_KEY[item.id];

            return (

              <Reveal

                as="li"

                key={item.id}

                delay={index * 90}

                className={index % 2 === 1 ? "md:mt-16 lg:mt-20" : undefined}

              >

                <ServiceBenefitCard

                  title={tDynamic(`services.${key}.title`)}

                  description={tDynamic(`services.${key}.description`)}

                  infoLabel={t("highlightedServicesInfoLabel")}

                  href="/vehicles"

                />

              </Reveal>

            );

          })}

        </ul>

      </Container>

    </section>

  );

}


