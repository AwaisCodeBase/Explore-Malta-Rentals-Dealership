import { FleetCategoryStrip } from "@/features/home/components/fleet-marquee";
import { HowItWorksBackground } from "@/features/home/components/how-it-works-background";
import { HowItWorksSteps } from "@/features/home/components/how-it-works-steps";
import { howItWorksSteps } from "@/features/home/data/home-sections";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export async function HowItWorksSection() {
  const t = await getTranslations("Home");
  const tDynamic = t as unknown as (key: string) => string;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative overflow-hidden scroll-mt-28 border-t border-white/[0.06] bg-black pt-0 pb-44 sm:pb-52 lg:pb-60"
    >
      <HowItWorksBackground />
      <Container className="relative z-10">
        <div className="py-20 sm:py-24 lg:py-28">
          <FleetCategoryStrip />
        </div>

        <Reveal className="how-it-works-display-headline mx-auto max-w-4xl text-center">
          <h2
            id="how-it-works-title"
            className="text-[clamp(2.125rem,5.2vw,4rem)] font-bold leading-[0.98] tracking-[-0.05em] text-white"
          >
            {t("howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-[clamp(1.08rem,2.6vw,2rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-white/38 sm:mt-5">
            {t("howItWorks.description")}
          </p>
        </Reveal>

        <HowItWorksSteps
          steps={howItWorksSteps.map((step) => ({
            id: step,
            title: tDynamic(`howItWorks.steps.${step}.title`),
            description: tDynamic(`howItWorks.steps.${step}.description`),
          }))}
        />
      </Container>
    </section>
  );
}
