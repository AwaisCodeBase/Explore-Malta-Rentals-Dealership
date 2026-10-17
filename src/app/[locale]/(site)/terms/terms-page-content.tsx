"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  Bike,
  CalendarClock,
  Car,
  CreditCard,
  FileCheck2,
  Fuel,
  Gavel,
  HandCoins,
  HeartPulse,
  IdCard,
  LifeBuoy,
  Receipt,
  Scale,
  Shield,
  Signature,
  UserCheck,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SITE_CONTACT, SITE_LOCATION_KICKER } from "@/lib/site-brand-copy";

const LAST_UPDATED = "20 August 2026";
const WEBSITE_URL = "https://exploremaltarentals.com";

type TermsSection = Readonly<{
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  warning?: ReactNode;
}>;

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Long-form legal prose: comfortable measure, generous paragraph rhythm and
 * list markers styled from the wrapper so the clause markup stays untouched.
 */
const LEGAL_PROSE_CLASS = [
  "max-w-[68ch] space-y-5 text-[0.9375rem] leading-[1.78] text-[var(--text-secondary)] sm:text-base",
  "[&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]",
  "[&_ul]:space-y-3 [&_ol]:space-y-3",
  "[&_ul>li]:marker:text-orange-400",
  "[&_ol>li]:marker:font-semibold [&_ol>li]:marker:text-[var(--text-faint)]",
  "[&_li]:pl-1.5",
].join(" ");

function WarningBox({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mt-7 max-w-[68ch] rounded-r-[var(--r-card)] border-l-[3px] border-l-orange-400 bg-orange-50/80 px-5 py-4 text-[0.9375rem] leading-[1.7] text-orange-950">
      <p className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden />
        <span>{children}</span>
      </p>
    </div>
  );
}

/** Decorative clause number — the heading text itself is unchanged. */
function SectionNumber({ index }: Readonly<{ index: number }>) {
  return (
    <span
      aria-hidden
      className="text-[0.6875rem] font-bold tabular-nums leading-none tracking-[0.14em] text-[var(--text-faint)]"
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

function SectionCard({ section, index }: Readonly<{ section: TermsSection; index: number }>) {
  return (
    <section
      id={section.id}
      className="scroll-mt-[calc(var(--site-header-offset)+2rem)]"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-[var(--surface-band)] text-[var(--ink-700)] ring-1 ring-inset ring-[var(--line-subtle)]"
          aria-hidden
        >
          {section.icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <SectionNumber index={index} />
          <h2
            id={`${section.id}-title`}
            className="type-h3 mt-2 text-[var(--text-primary)]"
          >
            {section.title}
          </h2>
        </div>
      </div>
      <div className={joinClasses("mt-6 pl-0 sm:pl-15", LEGAL_PROSE_CLASS)}>{section.content}</div>
      <div className="sm:pl-15">{section.warning ? <WarningBox>{section.warning}</WarningBox> : null}</div>
    </section>
  );
}

function DamageCostsTable() {
  const rows = [
    ["Minor scratches", "EUR 50 - EUR 150"],
    ["Mirrors", "EUR 40 - EUR 80"],
    ["Indicators", "EUR 30 - EUR 60"],
    ["Helmet loss", "EUR 80"],
    ["Key loss", "EUR 120"],
    ["Tyre damage", "EUR 80 - EUR 120"],
    ["Body panels", "EUR 150 - EUR 400"],
    ["Major damage", "Up to applicable insurance excess"],
    ["Total loss / theft", "Up to EUR 2,000+"],
  ] as const;

  return (
    <div className="overflow-hidden rounded-[var(--r-card)] bg-[var(--surface-card)] shadow-[var(--elev-2)] ring-1 ring-inset ring-[var(--line-subtle)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--surface-band)]">
          <tr>
            <th className="px-5 py-3.5 text-[0.6875rem] font-semibold uppercase leading-[1.2] tracking-[0.08em] text-[var(--text-muted)]">
              Damage type
            </th>
            <th className="px-5 py-3.5 text-[0.6875rem] font-semibold uppercase leading-[1.2] tracking-[0.08em] text-[var(--text-muted)]">
              Estimated cost
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([type, cost]) => (
            <tr
              key={type}
              className="border-t border-[var(--line-subtle)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:bg-[var(--surface-band)]/60"
            >
              <td className="px-5 py-3.5 text-[var(--text-secondary)]">{type}</td>
              <td className="px-5 py-3.5 font-semibold tabular-nums text-[var(--text-primary)]">
                {cost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TermsPageContent() {
  const sections = useMemo<TermsSection[]>(
    () => [
      {
        id: "driver-requirements",
        title: "Driver Requirements",
        icon: <UserCheck className="h-5 w-5" />,
        content: (
          <>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Minimum age: <strong>21 years</strong> for all vehicles (50cc, 125cc, and ATV/Quad).
              </li>
              <li>
                Valid driving licence required: <strong>AM</strong> for 50cc, <strong>A1/A2</strong> for 125cc.
              </li>
              <li>At pickup, customers must present a valid passport/ID and driving licence.</li>
            </ul>
          </>
        ),
        warning: "Non-EU licence holders may be required to provide an International Driving Permit (IDP).",
      },
      {
        id: "rental-period",
        title: "Rental Period",
        icon: <CalendarClock className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Rentals are calculated by day.</li>
            <li>
              Late return incurs <strong>EUR 20</strong> plus a <strong>full extra rental day</strong>.
            </li>
            <li>A no-show or delay exceeding 1 hour may result in booking cancellation.</li>
          </ul>
        ),
      },
      {
        id: "payments",
        title: "Payments",
        icon: <CreditCard className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Full rental payment is required before vehicle release.</li>
            <li>Accepted methods: cash and card.</li>
            <li>Displayed prices include VAT and basic insurance.</li>
          </ul>
        ),
      },
      {
        id: "security-deposit",
        title: "Security Deposit",
        icon: <HandCoins className="h-5 w-5" />,
        content: (
          <>
            <p>A refundable security deposit of <strong>EUR 250</strong> is required for all vehicles (cash or card hold at pickup).</p>
            <p>Deposit may be held for up to 7-10 days after return.</p>
          </>
        ),
      },
      {
        id: "insurance-liability",
        title: "Insurance & Liability",
        icon: <Shield className="h-5 w-5" />,
        content: (
          <>
            <p>Third-party liability insurance is included.</p>
            <p>Customer excess liability:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>50cc: EUR 500</li>
              <li>125cc: EUR 800</li>
              <li>ATV / Quad: EUR 1,200</li>
            </ul>
          </>
        ),
      },
      {
        id: "optional-insurance",
        title: "Optional Insurance (CDW)",
        icon: <Scale className="h-5 w-5" />,
        content: (
          <>
            <p>Collision Damage Waiver (CDW) options:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>EUR 3/day: reduces excess to EUR 500</li>
              <li>EUR 8/day: full coverage</li>
            </ul>
          </>
        ),
        warning:
          "CDW does not cover negligence, alcohol/drug use, off-road misuse, lost keys, or tyre damage.",
      },
      {
        id: "delivery-extras-fees",
        title: "Delivery, Extras & Fees",
        icon: <Receipt className="h-5 w-5" />,
        content: (
          <>
            <ul className="list-disc space-y-1 pl-5">
              <li>Delivery / collection: EUR 10 - EUR 20</li>
              <li>Additional driver: EUR 5/day</li>
              <li>Young driver fee (age 21-24): EUR 5/day</li>
              <li>Traffic fine administration fee: EUR 25</li>
            </ul>
            <p>Additional accessories may be charged separately where selected.</p>
          </>
        ),
      },
      {
        id: "vehicle-condition",
        title: "Vehicle Condition",
        icon: <Car className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Vehicles are provided in good working condition.</li>
            <li>Customer must inspect the vehicle before use.</li>
            <li>Photos at pickup are recommended.</li>
          </ul>
        ),
      },
      {
        id: "use-of-vehicle",
        title: "Use of Vehicle (Strict Rules)",
        icon: <Ban className="h-5 w-5" />,
        content: (
          <p className="text-slate-700">
            The following are strictly prohibited and constitute a material breach of this agreement:
          </p>
        ),
        warning:
          "Alcohol or drugs, reckless driving, racing, carrying more passengers than permitted, sub-renting, and taking the vehicle outside Malta.",
      },
      {
        id: "safety",
        title: "Safety",
        icon: <HeartPulse className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Helmets are provided and mandatory.</li>
            <li>Customer remains fully responsible for personal safety and riding behaviour.</li>
          </ul>
        ),
      },
      {
        id: "damage-costs",
        title: "Damage & Costs",
        icon: <Wrench className="h-5 w-5" />,
        content: <DamageCostsTable />,
      },
      {
        id: "accident-procedure",
        title: "Accident Procedure",
        icon: <FileCheck2 className="h-5 w-5" />,
        content: (
          <>
            <p>In case of an accident, the customer must:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Inform the company immediately.</li>
              <li>Contact police where required by law or circumstances.</li>
              <li>Not admit liability to third parties.</li>
            </ol>
            <p>Customer is responsible for repair costs, recovery, and loss of rental income.</p>
          </>
        ),
      },
      {
        id: "fines-traffic",
        title: "Fines & Traffic Violations",
        icon: <Gavel className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Customer is responsible for all fines and traffic violations during rental period.</li>
            <li>Administration fee per fine: EUR 25.</li>
          </ul>
        ),
      },
      {
        id: "fuel-policy",
        title: "Fuel Policy",
        icon: <Fuel className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Fuel policy is same-to-same.</li>
            <li>Refuel service fee: EUR 20 plus fuel cost.</li>
          </ul>
        ),
      },
      {
        id: "breakdown",
        title: "Breakdown",
        icon: <LifeBuoy className="h-5 w-5" />,
        content: (
          <>
            <p>Covered: mechanical faults.</p>
            <p>Not covered (charged to customer): wrong fuel, lost keys, battery misuse.</p>
          </>
        ),
      },
      {
        id: "atv-quad-clause",
        title: "ATV / Quad Clause",
        icon: <Bike className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Off-road use is not covered by insurance.</li>
            <li>Customer assumes full risk for ATV/Quad off-road operation.</li>
            <li>Any resulting damage is fully chargeable to the customer.</li>
          </ul>
        ),
      },
      {
        id: "cancellation-policy",
        title: "Cancellation Policy",
        icon: <CalendarClock className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Free cancellation up to 48 hours before rental start.</li>
            <li>Cancellations under 48 hours are non-refundable.</li>
          </ul>
        ),
      },
      {
        id: "loss-theft",
        title: "Loss / Theft",
        icon: <AlertTriangle className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Customer is fully liable for loss or theft.</li>
            <li>Charge may apply up to full vehicle value (approximately EUR 2,000+).</li>
          </ul>
        ),
      },
      {
        id: "gdpr-compliance",
        title: "GDPR Compliance",
        icon: <IdCard className="h-5 w-5" />,
        content: (
          <>
            <p>Customer data is processed under EU GDPR requirements.</p>
            <p>Data is used only for rental agreement execution and legal compliance duties.</p>
          </>
        ),
      },
      {
        id: "termination",
        title: "Termination",
        icon: <Ban className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Company may terminate rental immediately for dangerous driving or breach of terms.</li>
            <li>No refund is issued after termination for breach.</li>
          </ul>
        ),
      },
      {
        id: "liability-waiver",
        title: "Liability Waiver",
        icon: <Shield className="h-5 w-5" />,
        content: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Customer accepts the inherent risk of injury or death in vehicle operation.</li>
            <li>Company is not liable for accidents or personal belongings.</li>
          </ul>
        ),
      },
    ],
    [],
  );

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [openMobileSection, setOpenMobileSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.2, 0.4, 0.6] },
    );

    const sectionNodes = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];
    sectionNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [sections]);

  return (
    <main className="pb-16 pt-8 sm:pt-10 lg:pb-24">
      <Container>
        <section className="rounded-2xl border border-slate-200/90 bg-[var(--surface-card)] px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-orange)]">Legal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-5xl">
            Terms & Conditions
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Please read carefully before booking your vehicle.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-slate-200/90 bg-[var(--surface-elevated)] px-3 py-1 text-sm font-medium text-slate-700">
            Last updated: {LAST_UPDATED}
          </p>
        </section>

        <nav
          aria-label="Terms table of contents"
          className="mt-6 rounded-2xl border border-slate-200/90 bg-[var(--surface-elevated)] px-4 py-4 lg:hidden"
        >
          <p className="text-sm font-semibold text-slate-900">Table of Contents</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={joinClasses(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition",
                  activeSectionId === section.id
                    ? "border-[var(--brand-orange)]/80 bg-[var(--surface-card)] text-[var(--brand-orange-strong)]"
                    : "border-slate-200/90 bg-[var(--surface-card)] text-slate-700",
                )}
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200/90 bg-[var(--surface-elevated)] p-4">
              <p className="text-sm font-semibold text-slate-900">Table of Contents</p>
              <ul className="mt-3 space-y-1.5">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={joinClasses(
                        "block rounded-lg px-3 py-2 text-sm transition",
                        activeSectionId === section.id
                          ? "bg-[var(--surface-card)] font-semibold text-[var(--brand-orange-strong)] shadow-sm ring-1 ring-[var(--brand-orange)]/25"
                          : "text-slate-700 hover:bg-[var(--surface-card)] hover:text-slate-900",
                      )}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="space-y-4 lg:col-span-8 lg:space-y-5">
            <div className="space-y-4 lg:hidden">
              {sections.map((section) => {
                const isOpen = openMobileSection === section.id;
                return (
                  <article key={`mobile-${section.id}`} className="rounded-2xl border border-slate-200/90 bg-[var(--surface-card)]">
                    <button
                      type="button"
                      onClick={() => setOpenMobileSection(isOpen ? "" : section.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                      aria-expanded={isOpen}
                      aria-controls={`${section.id}-mobile-panel`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="rounded-lg bg-slate-100 p-2 text-slate-700">{section.icon}</span>
                        <span className="text-sm font-semibold text-slate-900">{section.title}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{isOpen ? "Close" : "Open"}</span>
                    </button>
                    {isOpen ? (
                      <div id={`${section.id}-mobile-panel`} className="border-t border-slate-200 px-4 py-4">
                        <div className="space-y-3 text-sm leading-6 text-slate-700">{section.content}</div>
                        {section.warning ? <WarningBox>{section.warning}</WarningBox> : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="hidden space-y-5 lg:block">
              {sections.map((section, index) => (
                <SectionCard
                  key={`desktop-${section.id}`}
                  section={section}
                  index={index}
                />
              ))}
            </div>

            <section
              id="agreement-signature"
              className="scroll-mt-28 rounded-2xl border border-slate-200/90 bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"
              aria-labelledby="agreement-signature-title"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                  <Signature className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="agreement-signature-title" className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                    Signature & Agreement
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
                By signing, the customer confirms they have read, understood, and accepted these Terms & Conditions.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Company: EXPLORE MALTA RENTALS",
                  "Customer Name",
                  "ID / Passport",
                  "Vehicle",
                  "Deposit Paid (EUR)",
                  "Insurance Option",
                  "Date",
                ].map((label) => (
                  <div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">{label}</p>
                    <div className="mt-4 h-6 border-b border-dashed border-slate-300" />
                  </div>
                ))}
                <div className="rounded-xl border border-slate-200 px-3 py-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Customer Signature</p>
                  <div className="mt-4 h-16 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
                  <p className="mt-2 text-xs text-slate-500">Digital signature ready area</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/90 bg-[var(--surface-elevated)] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Company Information</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">EXPLORE MALTA RENTALS</h2>
              <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>{SITE_CONTACT.phone}</p>
                <p>{SITE_CONTACT.email}</p>
                <p className="sm:col-span-2">{SITE_CONTACT.address}</p>
                <p className="sm:col-span-2">{WEBSITE_URL}</p>
              </div>
              <p className="mt-4 text-xs text-slate-500">Registered operations area: {SITE_LOCATION_KICKER}</p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
