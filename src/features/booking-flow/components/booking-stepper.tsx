"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { BOOKING_FLOW_STEPS, type BookingFlowStepId } from "@/features/booking-flow/lib/steps";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { canAccessStep } from "@/features/booking-flow/lib/validation";

function stepTitle(t: (key: string) => string, stepId: BookingFlowStepId) {
  switch (stepId) {
    case "rental_details":
      return t("steps.rental_details.title");
    case "options_delivery":
      return t("steps.options_delivery.title");
    case "your_information":
      return t("steps.your_information.title");
    case "review_confirm":
      return t("steps.review_confirm.title");
    default:
      return stepId;
  }
}

export function BookingStepper() {
  const t = useTranslations("BookingFlow");
  const { activeStepId, activeStepIndex, state, goToStep, bookingFlowSchema } = useBookingFlow();

  const lastIndex = BOOKING_FLOW_STEPS.length - 1;
  const progressPercent =
    lastIndex > 0 ? Math.min(100, Math.max(0, (activeStepIndex / lastIndex) * 100)) : 100;

  return (
    <nav
      aria-label={t("stepperAria")}
      className="surface-panel px-4 py-4 sm:px-6 sm:py-5"
    >
      <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {/* Connecting progress track — decorative, sits behind the step markers. */}
        <li
          aria-hidden
          className="pointer-events-none absolute top-[1.0625rem] right-[12.5%] left-[12.5%] hidden h-[3px] rounded-full bg-[var(--surface-sunken)] lg:block"
        >
          <span
            className="block h-full rounded-full bg-orange-400 transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]"
            style={{ width: `${progressPercent}%` }}
          />
        </li>

        {BOOKING_FLOW_STEPS.map((step, index) => {
          const isActive = step.id === activeStepId;
          const isComplete = index < activeStepIndex;
          const isAccessible = canAccessStep(bookingFlowSchema, step.id, state);

          const markerClass = isActive
            ? "border-orange-400 bg-orange-400 text-white shadow-[var(--elev-orange)]"
            : isComplete
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-[var(--line)] bg-[var(--surface-card)] text-[var(--text-faint)]";

          return (
            <li key={step.id} className="relative lg:z-10">
              <button
                type="button"
                onClick={() => goToStep(step.id)}
                disabled={!isAccessible}
                aria-current={isActive ? "step" : undefined}
                className={[
                  "group flex w-full items-center gap-3 rounded-[var(--r-field)] px-3 py-2 text-left transition duration-[var(--dur-base)] ease-[var(--ease-standard)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  "lg:flex-col lg:items-center lg:gap-2 lg:px-2 lg:text-center",
                  isActive ? "bg-orange-50/70" : "bg-transparent",
                  isAccessible
                    ? "cursor-pointer hover:bg-[var(--surface-soft)]"
                    : "cursor-not-allowed opacity-55",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums transition duration-[var(--dur-base)] ease-[var(--ease-standard)]",
                    markerClass,
                  ].join(" ")}
                  aria-hidden
                >
                  {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={[
                      "type-spec block",
                      isActive ? "text-orange-700" : "text-[var(--text-faint)]",
                    ].join(" ")}
                  >
                    {t("stepLabel", { n: index + 1 })}
                  </span>
                  <span
                    className={[
                      "mt-1 block text-sm font-semibold tracking-[-0.01em]",
                      isActive || isComplete
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {stepTitle(t, step.id)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
