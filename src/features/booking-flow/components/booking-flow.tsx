"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { BookingFlowProvider, useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { useVehicles } from "@/features/vehicles/lib/use-vehicles";
import { BookingStepper } from "@/features/booking-flow/components/booking-stepper";
import { ReservationBanner } from "@/features/booking-flow/components/reservation-banner";
import { HoldExpiredNotice } from "@/features/booking-flow/components/hold-expired-notice";
import { TermsConsentModal } from "@/features/booking-flow/components/terms-consent-modal";
import { InsurancePromptModal } from "@/features/booking-flow/components/insurance-prompt-modal";
import { NoVehicleModal } from "@/features/booking-flow/components/no-vehicle-modal";
import { BookingLookupPanel } from "@/features/booking-flow/components/booking-lookup-panel";
import { useHoldHeartbeat } from "@/features/booking-flow/hooks/use-hold-heartbeat";
import { useHoldCountdown } from "@/features/booking-flow/hooks/use-hold-countdown";
import { BOOKING_FLOW_STEPS } from "@/features/booking-flow/lib/steps";
import { mapBookingFlowStateToSubmission } from "@/features/booking-flow/lib/map-booking-flow-to-submission";
import { createBookingIdempotencyKey } from "@/features/booking-flow/lib/booking-idempotency-key";
import {
  clearPendingBookingSessionUploads,
  collectPendingBookingUploads,
} from "@/features/booking-flow/lib/pending-booking-uploads";
import { uploadBookingDocument } from "@/features/booking-flow/lib/upload-booking-document";
import {
  mapApiBookingErrorPathToFormPath,
  summarizeApiBookingErrors,
} from "@/features/booking-flow/lib/map-api-booking-error-to-form";
import { submitBooking } from "@/features/booking-flow/lib/submit-booking-api";
import { extendReservationHoldForCheckout } from "@/features/booking-flow/lib/reservation-hold-api";
import { RentalDetailsStep } from "@/features/booking-flow/steps/rental-details-step";
import { OptionsDeliveryStep } from "@/features/booking-flow/steps/options-delivery-step";
import { YourInformationStep } from "@/features/booking-flow/steps/your-information-step";
import { ReviewConfirmStep } from "@/features/booking-flow/steps/review-confirm-step";
import type { InsurancePlanCode } from "@/lib/pricing/insurance-plans";
import { calculateCalendarRentalDays } from "@/lib/pricing/rental-duration";

type BookingFlowBodyProps = {
  bookingLookupReference?: string;
  bookingLookupEmail?: string;
  bookingSubmittedBanner?: boolean;
  bookedVehicleLabel?: string;
};

function BookingFlowBody({
  bookingLookupReference,
  bookingLookupEmail,
  bookingSubmittedBanner,
  bookedVehicleLabel,
}: BookingFlowBodyProps) {
  const router = useRouter();
  const t = useTranslations("BookingFlow");
  const tColor = useTranslations("BookingSteps.color");
  const tLookup = useTranslations("BookingPage.lookup");
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceModalKey, setInsuranceModalKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [heartbeatWarning, setHeartbeatWarning] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const submitIdempotencyKeyRef = useRef<string | null>(null);
  const submitInFlightRef = useRef(false);
  const {
    bookingFlowSchema,
    state,
    bookingSessionId,
    reservationHold,
    reservationHoldError,
    isCreatingHold,
    isReleasingHold,
    activeStepId,
    activeStepIndex,
    isFirstStep,
    isLastStep,
    stepErrors,
    goBack,
    goNext,
    updateSection,
    getBookingValues,
    applyConsentFromTermsModal,
    clearServerFieldErrors,
    applyApiValidationErrors,
    setReservationHoldError,
    updateReservationHold,
    createOrRefreshReservationHold,
    releaseReservationHold,
    markReservationHoldExpired,
    clearReservationHold,
    resetBookingForm,
    validateCurrentStep,
    validateAllBookingFields,
    setManualFieldError,
  } = useBookingFlow();

  const rentalWindow = useMemo(() => {
    const { pickupDate, pickupTime, returnDate, returnTime } = state.rental;
    if (!pickupDate.trim() || !pickupTime.trim() || !returnDate.trim() || !returnTime.trim()) {
      return null;
    }
    return {
      pickupDate: pickupDate.trim(),
      pickupTime: pickupTime.trim(),
      returnDate: returnDate.trim(),
      returnTime: returnTime.trim(),
      sessionKey: reservationHold.sessionKey?.trim() || undefined,
    };
  }, [
    reservationHold.sessionKey,
    state.rental.pickupDate,
    state.rental.pickupTime,
    state.rental.returnDate,
    state.rental.returnTime,
  ]);

  const { vehicles } = useVehicles({ rentalWindow });

  const holdIsActive =
    reservationHold.status === "ACTIVE" &&
    Boolean(reservationHold.holdReference) &&
    Boolean(reservationHold.expiresAt);
  const holdMatchesCurrentRental =
    reservationHold.holdReference !== null &&
    reservationHold.vehicleId !== null &&
    reservationHold.vehicleId === state.rental.vehicleId &&
    reservationHold.pickupDate === state.rental.pickupDate &&
    reservationHold.pickupTime === state.rental.pickupTime &&
    reservationHold.returnDate === state.rental.returnDate &&
    reservationHold.returnTime === state.rental.returnTime;

  const countdown = useHoldCountdown(reservationHold.expiresAt, holdIsActive);
  const holdIsExpired = reservationHold.status === "EXPIRED" || (reservationHold.status === "ACTIVE" && countdown.isExpired);
  const checkoutHoldExtendedForRef = useRef<string | null>(null);

  const ensureCheckoutHoldExtension = useCallback(async () => {
    const holdReference = reservationHold.holdReference?.trim();
    if (!holdReference || !holdIsActive || holdIsExpired) {
      return;
    }
    if (checkoutHoldExtendedForRef.current === holdReference) {
      return;
    }
    checkoutHoldExtendedForRef.current = holdReference;

    const result = await extendReservationHoldForCheckout(holdReference);
    if (!result.ok) {
      // Allow a retry on the next trigger if the extension failed.
      checkoutHoldExtendedForRef.current = null;
      return;
    }

    const expiresAt =
      typeof result.data.expiresAt === "string"
        ? result.data.expiresAt
        : new Date(result.data.expiresAt).toISOString();
    updateReservationHold({ expiresAt, status: result.data.status });
  }, [
    holdIsActive,
    holdIsExpired,
    reservationHold.holdReference,
    updateReservationHold,
  ]);

  useEffect(() => {
    if (activeStepId !== "review_confirm") {
      return;
    }
    void ensureCheckoutHoldExtension();
  }, [activeStepId, ensureCheckoutHoldExtension]);

  useHoldHeartbeat({
    holdReference: reservationHold.holdReference,
    status: reservationHold.status,
    enabled: !submitting,
    onHeartbeatSuccess: (expiresAt, status) => {
      setHeartbeatWarning(null);
      setReservationHoldError(null);
      updateReservationHold({ expiresAt, status });
    },
    onHeartbeatExpired: (message) => {
      markReservationHoldExpired(message);
      setHeartbeatWarning(null);
      setTermsModalOpen(false);
      setInsuranceModalOpen(false);
    },
    onHeartbeatTransientError: (message) => {
      setHeartbeatWarning(message);
    },
  });

  useEffect(() => {
    submitIdempotencyKeyRef.current = null;
  }, [
    state.rental.vehicleId,
    state.rental.pickupDate,
    state.rental.pickupTime,
    state.rental.returnDate,
    state.rental.returnTime,
  ]);

  const resetSubmitAttempt = useCallback(() => {
    submitIdempotencyKeyRef.current = null;
    submitInFlightRef.current = false;
  }, []);

  useEffect(() => {
    if (!holdIsExpired || reservationHold.status !== "ACTIVE") {
      return;
    }
    markReservationHoldExpired(t("holdExpiredDefault"));
  }, [holdIsExpired, markReservationHoldExpired, reservationHold.status, t]);

  useEffect(() => {
    if (!bookingSubmittedBanner || !bookingLookupReference) {
      return;
    }
    setShowSuccessToast(true);
    const timer = window.setTimeout(() => setShowSuccessToast(false), 6000);
    return () => window.clearTimeout(timer);
  }, [bookingLookupReference, bookingSubmittedBanner]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    flowContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeStepId]);

  const activeStep =
    activeStepId === "rental_details" ? (
      <RentalDetailsStep />
    ) : activeStepId === "options_delivery" ? (
      <OptionsDeliveryStep />
    ) : activeStepId === "your_information" ? (
      <YourInformationStep />
    ) : activeStepId === "review_confirm" ? (
      <ReviewConfirmStep />
    ) : null;

  const handlePrimaryClick = useCallback(async () => {
    if (!isLastStep) {
      if (activeStepId === "rental_details") {
        setSubmitError(null);
        const validStep = await validateCurrentStep();
        if (!validStep) {
          return;
        }
        const selectedVehicle = vehicles.find((vehicle) => vehicle.id === state.rental.vehicleId);
        if (
          selectedVehicle?.availableColors &&
          selectedVehicle.availableColors.length > 0 &&
          !state.rental.selectedColor
        ) {
          setManualFieldError("rental.selectedColor", tColor("required"));
          setSubmitError(tColor("required"));
          return;
        }
        const holdResult = await createOrRefreshReservationHold();
        if (!holdResult.ok) {
          setSubmitError(holdResult.message ?? t("unableReserve"));
          return;
        }
      }
      void goNext();
      return;
    }

    setSubmitError(null);
    clearServerFieldErrors();
    const valid = await validateAllBookingFields();
    if (!valid) {
      const parsed = bookingFlowSchema.safeParse(getBookingValues());
      setSubmitError(
        parsed.success
          ? t("reviewFields")
          : parsed.error.issues[0]?.message ?? t("reviewFields"),
      );
      return;
    }

    const currentValues = getBookingValues();
    if (currentValues.addons.cdwPlan === null) {
      setInsuranceModalKey((key) => key + 1);
      void ensureCheckoutHoldExtension();
      setInsuranceModalOpen(true);
      return;
    }

    void ensureCheckoutHoldExtension();
    setTermsModalOpen(true);
  }, [
    activeStepId,
    bookingFlowSchema,
    clearServerFieldErrors,
    createOrRefreshReservationHold,
    ensureCheckoutHoldExtension,
    getBookingValues,
    goNext,
    isLastStep,
    setManualFieldError,
    state.rental.selectedColor,
    state.rental.vehicleId,
    t,
    tColor,
    validateCurrentStep,
    validateAllBookingFields,
    vehicles,
  ]);

  const handleInsuranceConfirm = useCallback(
    (plan: InsurancePlanCode) => {
      updateSection("addons", {
        cdwPlan: plan,
        cdw: plan !== "NO_INSURANCE",
      });
      setInsuranceModalOpen(false);
      void ensureCheckoutHoldExtension();
      setTermsModalOpen(true);
    },
    [ensureCheckoutHoldExtension, updateSection],
  );

  const handleTermsAgree = useCallback(async () => {
    if (submitInFlightRef.current) {
      return;
    }

    if (!reservationHold.holdReference || !holdIsActive || !holdMatchesCurrentRental) {
      setTermsModalOpen(false);
      setSubmitError(t("holdExpiredDefault"));
      markReservationHoldExpired();
      return;
    }

    // Refresh checkout grace window before uploads + booking submit.
    checkoutHoldExtendedForRef.current = null;
    await ensureCheckoutHoldExtension();

    const acceptedAt = new Date().toISOString();
    applyConsentFromTermsModal(acceptedAt);

    const stateAfterConsent = getBookingValues();
    if (!stateAfterConsent.consent.termsAccepted) {
      setSubmitError(t("acceptTerms"));
      return;
    }

    const idempotencyKey = submitIdempotencyKeyRef.current ?? createBookingIdempotencyKey();
    submitIdempotencyKeyRef.current = idempotencyKey;
    submitInFlightRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    clearServerFieldErrors();

    try {
      const payload = mapBookingFlowStateToSubmission(
        stateAfterConsent,
        reservationHold.holdReference,
        idempotencyKey,
      );
      const pendingUploads = collectPendingBookingUploads(bookingSessionId);
      for (const pendingUpload of pendingUploads) {
        const uploaded = await uploadBookingDocument(
          pendingUpload.file,
          pendingUpload.category,
          bookingSessionId,
        );
        if (!uploaded.ok) {
          setTermsModalOpen(false);
          updateSection("consent", { termsAccepted: false, termsAcceptedAt: "" });
          setSubmitError(uploaded.message);
          return;
        }

        if (pendingUpload.category === "customer_license") {
          payload.customer.licenseUploadPath = uploaded.relativePath;
        } else if (pendingUpload.category === "customer_passport") {
          payload.customer.passportUploadPath = uploaded.relativePath;
        } else if (pendingUpload.category === "additional_driver_passport") {
          payload.additionalDriver.passportUploadPath = uploaded.relativePath;
        } else if (pendingUpload.category === "additional_driver_license") {
          payload.additionalDriver.licenseUploadPath = uploaded.relativePath;
        } else if (pendingUpload.category === "payment_proof") {
          if (!payload.payment) {
            payload.payment = { mode: "ALREADY_PAID", proofPath: uploaded.relativePath };
          } else {
            payload.payment.proofPath = uploaded.relativePath;
          }
        }
      }

      const result = await submitBooking(payload);

      if (result.ok) {
        setTermsModalOpen(false);
        clearPendingBookingSessionUploads(bookingSessionId);
        clearReservationHold();

        // If online payment is due, redirect to Stripe Checkout
        if (result.totalDueOnline > 0) {
          try {
            const checkoutRes = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingReference: result.bookingReference,
                locale: "en",
              }),
            });
            const checkoutData = (await checkoutRes.json()) as { ok: boolean; checkoutUrl?: string; error?: string };

            if (checkoutData.ok && checkoutData.checkoutUrl) {
              // Hard redirect — Stripe Checkout runs on Stripe's domain
              window.location.href = checkoutData.checkoutUrl;
              return;
            }

            // Checkout session creation failed — show error but booking already exists
            setSubmitError(
              checkoutData.error ??
              `Booking ${result.bookingReference} created but could not start payment. Please contact support.`,
            );
            resetBookingForm();
            return;
          } catch {
            setSubmitError(
              `Booking ${result.bookingReference} created but could not start payment. Please contact support.`,
            );
            resetBookingForm();
            return;
          }
        }

        // No online payment required (legacy pay-at-pickup flow)
        resetBookingForm();
        resetSubmitAttempt();
        router.push(
          `/booking?ref=${encodeURIComponent(result.bookingReference)}&submitted=1&email=${encodeURIComponent(payload.customer.email)}&vehicle=${encodeURIComponent(state.rental.vehicleSlug || state.rental.vehicleType)}`,
        );
        return;
      }

      setTermsModalOpen(false);
      updateSection("consent", { termsAccepted: false, termsAcceptedAt: "" });

      if (result.errors?.length) {
        applyApiValidationErrors(result.errors);
        const mapped = result.errors.filter((err) => mapApiBookingErrorPathToFormPath(err.path));
        const unmapped = result.errors.filter((err) => !mapApiBookingErrorPathToFormPath(err.path));
        const parts = [
          result.message,
          unmapped.length ? summarizeApiBookingErrors(unmapped) : "",
          mapped.length ? t("issuesHighlighted") : "",
        ].filter(Boolean);
        setSubmitError(parts.join(" "));
        const holdConflict = result.errors.some((err) => err.path === "holdReference");
        if (holdConflict || result.status === 409) {
          markReservationHoldExpired(t("holdExpiredDefault"));
        }
        return;
      }

      if (result.status === 409) {
        markReservationHoldExpired(t("holdExpiredDefault"));
      }
      setSubmitError(result.message);
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [
    applyApiValidationErrors,
    applyConsentFromTermsModal,
    bookingSessionId,
    clearServerFieldErrors,
    clearReservationHold,
    ensureCheckoutHoldExtension,
    getBookingValues,
    holdIsActive,
    holdMatchesCurrentRental,
    markReservationHoldExpired,
    reservationHold.holdReference,
    resetBookingForm,
    resetSubmitAttempt,
    router,
    state.rental.vehicleSlug,
    state.rental.vehicleType,
    t,
    updateSection,
  ]);

  const handleCancelBooking = useCallback(async () => {
    await releaseReservationHold();
    clearPendingBookingSessionUploads(bookingSessionId);
    resetSubmitAttempt();
    resetBookingForm();
    router.push("/vehicles");
  }, [bookingSessionId, releaseReservationHold, resetBookingForm, resetSubmitAttempt, router]);

  return (
    <div ref={flowContainerRef} className="space-y-5 sm:space-y-6">
      <BookingLookupPanel
        initialReference={bookingLookupReference}
        initialEmail={bookingLookupEmail}
        showSubmittedBanner={bookingSubmittedBanner}
      />
      {showSuccessToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-4 z-50 w-[min(92vw,24rem)] rounded-[var(--r-card)] border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-950 shadow-[var(--elev-5)]"
        >
          <p className="flex items-center gap-2 font-semibold tracking-[-0.01em]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            {tLookup("toastTitle")}
          </p>
          <p className="mt-1 text-emerald-900">{tLookup("toastBody")}</p>
          <p className="mt-2.5 text-xs text-emerald-900/90">
            {tLookup("referenceLabel")}:{" "}
            <span className="font-mono font-semibold tabular-nums">{bookingLookupReference}</span>
          </p>
          {bookedVehicleLabel ? (
            <p className="text-xs text-emerald-900/90">
              {tLookup("vehicleLabel")}: <span className="font-medium">{bookedVehicleLabel}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      <BookingStepper />

      {holdIsActive ? (
        <ReservationBanner remainingLabel={countdown.remainingLabel} />
      ) : null}

      {holdIsExpired || reservationHoldError ? (
        <HoldExpiredNotice message={reservationHoldError ?? t("holdExpiredDefault")} />
      ) : null}

      {heartbeatWarning ? (
        <p className="flex items-start gap-2.5 rounded-[var(--r-card)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-[var(--elev-1)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          {heartbeatWarning}
        </p>
      ) : null}

      <div>{activeStep}</div>

      {stepErrors[activeStepId] ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--r-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-[var(--elev-1)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
          {stepErrors[activeStepId]}
        </p>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--r-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-[var(--elev-1)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
          {submitError}
        </p>
      ) : null}

      <InsurancePromptModal
        key={insuranceModalKey}
        isOpen={insuranceModalOpen}
        rentalDays={calculateCalendarRentalDays(state.rental.pickupDate, state.rental.returnDate)}
        initialPlan={state.addons.cdwPlan}
        onCancel={() => setInsuranceModalOpen(false)}
        onConfirm={handleInsuranceConfirm}
      />

      <TermsConsentModal
        isOpen={termsModalOpen}
        isSubmitting={submitting}
        onCancel={() => {
          if (submitting) {
            return;
          }
          setTermsModalOpen(false);
        }}
        onAgree={handleTermsAgree}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {t("stepOf", { current: activeStepIndex + 1, total: BOOKING_FLOW_STEPS.length })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleCancelBooking();
            }}
            disabled={submitting || isReleasingHold}
            className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isReleasingHold ? t("cancelling") : t("cancelBooking")}
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={isFirstStep || submitting || isCreatingHold}
            className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("back")}
          </button>
          <button
            type="button"
            onClick={() => {
              void handlePrimaryClick();
            }}
            disabled={
              submitting ||
              isCreatingHold ||
              (activeStepId === "rental_details" && !state.rental.pricingAcknowledged) ||
              (isLastStep && (!holdIsActive || !holdMatchesCurrentRental || holdIsExpired))
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-orange)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(() => {
              if (isCreatingHold) {
                return t("reserving");
              }
              if (isLastStep) {
                return submitting ? t("submitting") : t("confirmBooking");
              }
              if (
                activeStepId === "rental_details" &&
                !(holdIsActive && holdMatchesCurrentRental && !holdIsExpired)
              ) {
                return t("bookNow");
              }
              return (
                <>
                  {t("next")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              );
            })()}
          </button>
        </div>
      </div>
    </div>
  );
}

type BookingFlowProps = {
  initialVehicleSlug?: string;
  initialRental?: {
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
    selectedColor?: string;
  };
  bookingLookupReference?: string;
  bookingLookupEmail?: string;
  bookingSubmittedBanner?: boolean;
  bookedVehicleLabel?: string;
};

export function BookingFlow({
  initialVehicleSlug,
  initialRental,
  bookingLookupReference,
  bookingLookupEmail,
  bookingSubmittedBanner,
  bookedVehicleLabel,
}: BookingFlowProps) {
  const [showNoVehicleModal, setShowNoVehicleModal] = useState(!initialVehicleSlug);

  return (
    <BookingFlowProvider initialVehicleSlug={initialVehicleSlug} initialRental={initialRental}>
      <NoVehicleModal
        show={showNoVehicleModal}
        onDismiss={() => setShowNoVehicleModal(false)}
      />
      <BookingFlowBody
        bookingLookupReference={bookingLookupReference}
        bookingLookupEmail={bookingLookupEmail}
        bookingSubmittedBanner={bookingSubmittedBanner}
        bookedVehicleLabel={bookedVehicleLabel}
      />
    </BookingFlowProvider>
  );
}
