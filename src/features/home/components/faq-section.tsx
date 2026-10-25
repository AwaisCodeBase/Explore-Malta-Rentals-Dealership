"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { faqItems } from "@/features/home/data/faq-content";

export function FaqSection() {
  const t = useTranslations("Faq");
  const tDynamic = t as unknown as (key: string) => string;
  const tWhatsApp = useTranslations("WhatsApp");
  const baseId = useId();
  const firstId = faqItems[0]?.id ?? "0";
  const [openId, setOpenId] = useState<string | null>(firstId);

  return (
    <section
      id="faq"
      aria-labelledby={`${baseId}-faq-heading`}
      className="scroll-mt-28 bg-[#E5E5E5] py-16 sm:py-20"
    >
      <div className="relative">
        <Container className="relative !max-w-6xl !px-12 sm:!px-16 md:!px-20 lg:!px-28 xl:!px-36">
          <Reveal className="text-left">
            <h2
              id={`${baseId}-faq-heading`}
              className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl"
            >
              {t("title")}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              {t("subtitleLead")}
              <span className="font-medium text-slate-800">
                {tWhatsApp("faqLabel")}
              </span>
              {t("subtitleTail")}
            </p>
          </Reveal>

          <div className="mt-12">
            <ul className="flex flex-col">
              {faqItems.map((item, index) => {
                const isOpen = openId === item.id;
                const panelId = `${baseId}-panel-${item.id}`;
                const buttonId = `${baseId}-trigger-${item.id}`;
                const isLast = index === faqItems.length - 1;
                const question = tDynamic(`items.${item.id}.question`);
                const answer = tDynamic(`items.${item.id}.answer`);

                return (
                  <li
                    key={item.id}
                    className={
                      isLast
                        ? undefined
                        : "border-b border-slate-200/90 pb-1"
                    }
                  >
                    <div
                      className={[
                        "rounded-xl transition-[background-color,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none",
                        isOpen
                          ? "border border-slate-200/90 bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:shadow-[0_8px_28px_-14px_rgba(15,23,42,0.12)] sm:px-6 sm:py-6"
                          : "px-3 py-5 hover:bg-slate-50 hover:shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)] sm:px-4 sm:py-6",
                      ].join(" ")}
                    >
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="group flex w-full items-start justify-between gap-4 rounded-lg text-left transition-colors duration-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E5E5E5]"
                        onClick={() =>
                          setOpenId((prev) =>
                            prev === item.id ? null : item.id,
                          )
                        }
                      >
                        <span className="text-base font-semibold text-slate-950 transition-colors duration-200 group-hover:text-slate-900 sm:text-[1.05rem]">
                          {question}
                        </span>
                        <span
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-lg font-light leading-none text-slate-500 transition-[color,transform] duration-300 ease-out group-hover:text-slate-700 motion-reduce:transition-none"
                        >
                          {isOpen ? "-" : "+"}
                        </span>
                      </button>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        aria-hidden={!isOpen}
                        className={[
                          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        ].join(" ")}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={[
                              "text-left text-sm leading-7 text-slate-600 transition-[margin,opacity] duration-300 ease-out sm:text-base motion-reduce:transition-none",
                              isOpen
                                ? "mt-4 opacity-100"
                                : "mt-0 opacity-0",
                            ].join(" ")}
                          >
                            {answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Container>
      </div>
    </section>
  );
}
