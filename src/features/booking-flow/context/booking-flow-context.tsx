"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FieldErrors,
  type FieldPath,
  get,
  useForm,
  useWatch,
} from "react-hook-form";
import { BOOKING_FLOW_STEPS, type BookingFlowStepId } from "@/features/booking-flow/lib/steps";
import {
  type BookingFlowState,
  type ReservationHoldState,
  INITIAL_RESERVATION_HOLD_STATE,
} from "@/features/booking-flow/lib/types";
import { buildBookingInitialState } from "@/features/booking-flow/lib/init-state";
import { getPickupDeliveryResetForSunday } from "@/lib/booking/delivery-availability";
import {
  createBookingFlowSchema,
  canAccessStep,
  getStepFirstError,
  STEP_FIELD_PATHS,
  type BookingValidationMessages,
} from "@/features/booking-flow/lib/validation";
import { mapApiBookingErrorPathToFormPath } from "@/features/booking-flow/lib/map-api-booking-error-to-form";
import type { BookingApiValidationError } from "@/features/booking-flow/lib/submit-booking-api";
import { getReservationHold } from "@/features/booking-flow/lib/reservation-hold-api";
import { useReservationHold } from "@/features/booking-flow/hooks/use-reservation-hold";
import { RESERVATION_HOLD_STORAGE_KEY } from "@/features/booking-flow/lib/reservation-hold-storage";

function createBookingSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SERVER_VALIDATED_PATHS = [
  "customer.driverLicenseUpload",
  "customer.passportUpload",
  "additionalDriver.passportIdUpload",
  "delivery.pickupAddress",
  "delivery.dropoffAddress",
  "customer.licenseConfirmationCheckbox",
  "customer.idConfirmationCheckbox",
  "additionalDriver.officeIdConfirmed",
  "customer.fullName",
  "customer.phone",
  "customer.email",
  "customer.nationality",
  "customer.dateOfBirth",
  "customer.licenseCategory",
  "additionalDriver.fullName",
  "additionalDriver.phone",
  "additionalDriver.email",
  "additionalDriver.nationality",
  "additionalDriver.dateOfBirth",
  "additionalDriver.licenseCategory",
  "rental.pickupDate",
  "rental.returnDate",
  "rental.pickupTime",
  "rental.returnTime",
  "addons.helmetSize1",
  "addons.helmetSize2",
  "addons.cdwPlan",
  "deposit.depositMethod",
  "payment.mode",
  "payment.proofPath",
  "consent.termsAccepted",
] as const satisfies readonly FieldPath<BookingFlowState>[];

function loadStoredReservationHold(): ReservationHoldState {
  if (typeof window === "undefined") {
    return INITIAL_RESERVATION_HOLD_STATE;
  }
  const stored = window.sessionStorage.getItem(RESERVATION_HOLD_STORAGE_KEY);
  if (!stored) {
    return INITIAL_RESERVATION_HOLD_STATE;
  }
  try {
    const parsed = JSON.parse(stored) as ReservationHoldState;
    if (!parsed || typeof parsed !== "object" || !parsed.holdReference) {
      window.sessionStorage.removeItem(RESERVATION_HOLD_STORAGE_KEY);
      return INITIAL_RESERVATION_HOLD_STATE;
    }
    return {
      holdReference: parsed.holdReference ?? null,
      sessionKey: parsed.sessionKey ?? null,
      expiresAt: parsed.expiresAt ?? null,
      status: parsed.status ?? null,
      vehicleId: parsed.vehicleId ?? null,
      vehicleSlug: parsed.vehicleSlug ?? null,
      vehicleType: parsed.vehicleType ?? null,
      selectedColor: parsed.selectedColor ?? null,
      pickupDate: parsed.pickupDate ?? null,
      pickupTime: parsed.pickupTime ?? null,
      returnDate: parsed.returnDate ?? null,
      returnTime: parsed.returnTime ?? null,
    };
  } catch {
    window.sessionStorage.removeItem(RESERVATION_HOLD_STORAGE_KEY);
    return INITIAL_RESERVATION_HOLD_STATE;
  }
}

type BookingFlowContextValue = {
  bookingFlowSchema: z.ZodType<BookingFlowState>;
  state: BookingFlowState;
  reservationHold: ReservationHoldState;
  reservationHoldError: string | null;
  isCreatingHold: boolean;
  isReleasingHold: boolean;
  activeStepIndex: number;
  activeStepId: BookingFlowStepId;
  stepErrors: Partial<Record<BookingFlowStepId, string>>;
  fieldErrors: FieldErrors<BookingFlowState>;
  isFirstStep: boolean;
  isLastStep: boolean;
  bookingSessionId: string;
  updateSection: <K extends keyof BookingFlowState>(
    section: K,
    value: Partial<BookingFlowState[K]>,
  ) => void;
  getFieldError: (path: FieldPath<BookingFlowState>) => string | null;
  isFieldInvalid: (path: FieldPath<BookingFlowState>) => boolean;
  goBack: () => void;
  goNext: () => Promise<boolean>;
  goToStep: (stepId: BookingFlowStepId) => void;
  getBookingValues: () => BookingFlowState;
  applyConsentFromTermsModal: (acceptedAtIso: string) => void;
  clearServerFieldErrors: () => void;
  applyApiValidationErrors: (errors: BookingApiValidationError[]) => void;
  setReservationHoldError: (message: string | null) => void;
  updateReservationHold: (next: Partial<ReservationHoldState>) => void;
  createOrRefreshReservationHold: () => Promise<{ ok: boolean; message?: string }>;
  releaseReservationHold: () => Promise<void>;
  markReservationHoldExpired: (message?: string) => void;
  refreshReservationHoldFromServer: () => Promise<void>;
  clearReservationHold: () => void;
  resetBookingForm: () => void;
  validateCurrentStep: () => Promise<boolean>;
  validateAllBookingFields: () => Promise<boolean>;
  setManualFieldError: (path: FieldPath<BookingFlowState>, message: string) => void;
};

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

type BookingFlowProviderProps = PropsWithChildren<{
  initialVehicleSlug?: string;
  initialRental?: {
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
    selectedColor?: string;
  };
}>;

export function BookingFlowProvider({ children, initialVehicleSlug, initialRental }: BookingFlowProviderProps) {
  const tVal = useTranslations("BookingValidation");
  const tFlow = useTranslations("BookingFlow");
  const validationMessages = useMemo<BookingValidationMessages>(
    () => ({
      vehicleTypeRequired: tVal("vehicleTypeRequired"),
      pickupOptionRequired: tVal("pickupOptionRequired"),
      dropoffOptionRequired: tVal("dropoffOptionRequired"),
      fullNameRequired: tVal("fullNameRequired"),
      phoneRequired: tVal("phoneRequired"),
      emailRequired: tVal("emailRequired"),
      emailInvalid: tVal("emailInvalid"),
      nationalityRequired: tVal("nationalityRequired"),
      dobRequired: tVal("dobRequired"),
      pickupDateRequired: tVal("pickupDateRequired"),
      pickupTimeRequired: tVal("pickupTimeRequired"),
      returnDateRequired: tVal("returnDateRequired"),
      returnTimeRequired: tVal("returnTimeRequired"),
      minRental: tVal("minRental"),
      maxRental: tVal("maxRental"),
      pickupAddressDelivery: tVal("pickupAddressDelivery"),
      deliveryUnavailableSunday: tVal("deliveryUnavailableSunday"),
      dropoffAddressRequired: tVal("dropoffAddressRequired"),
      helmetSizesRequired: tVal("helmetSizesRequired"),
      additionalDriverName: tVal("additionalDriverName"),
      additionalDriverPhone: tVal("additionalDriverPhone"),
      additionalDriverEmail: tVal("additionalDriverEmail"),
      additionalDriverNationality: tVal("additionalDriverNationality"),
      additionalDriverDob: tVal("additionalDriverDob"),
      additionalDriverLicense: tVal("additionalDriverLicense"),
      additionalPassportDelivery: tVal("additionalPassportDelivery"),
      additionalOfficeConfirm: tVal("additionalOfficeConfirm"),
      licenseCategoryRequired: tVal("licenseCategoryRequired"),
      licenseInvalidForVehicle: tVal("licenseInvalidForVehicle"),
      licenseUploadDelivery: tVal("licenseUploadDelivery"),
      passportUploadDelivery: tVal("passportUploadDelivery"),
      confirmDocumentsPickup: tVal("confirmDocumentsPickup"),
      depositMethodRequired: tVal("depositMethodRequired"),
      paymentProofRequired: tVal("paymentProofRequired"),
      colorRequired: tVal("colorRequired"),
      pricingAcknowledgedRequired: tVal("pricingAcknowledgedRequired"),
      reviewFields: tVal("reviewFields"),
    }),
    [tVal],
  );

  const bookingFlowSchema = useMemo(
    () => createBookingFlowSchema(validationMessages),
    [validationMessages],
  );

  const initialVehicleSlugRef = useRef(initialVehicleSlug);
  const initialRentalRef = useRef(initialRental);
  useEffect(() => {
    initialVehicleSlugRef.current = initialVehicleSlug;
    initialRentalRef.current = initialRental;
  }, [initialRental, initialVehicleSlug]);

  const [bookingSessionId, setBookingSessionId] = useState(createBookingSessionId);
  /** Same initial value on server and client — session restore runs after mount to avoid hydration mismatch. */
  const [reservationHold, setReservationHold] = useState<ReservationHoldState>(INITIAL_RESERVATION_HOLD_STATE);
  const [reservationHoldError, setReservationHoldError] = useState<string | null>(null);
  const [isCreatingHold, setIsCreatingHold] = useState(false);
  const [isReleasingHold, setIsReleasingHold] = useState(false);

  const form = useForm<BookingFlowState>({
    resolver: zodResolver(bookingFlowSchema),
    defaultValues: buildBookingInitialState(initialVehicleSlug, initialRental),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    form.clearErrors();
  }, [bookingFlowSchema, form]);
  const watchedState = useWatch({ control: form.control }) as BookingFlowState | undefined;
  const state = watchedState ?? form.getValues();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepErrors, setStepErrors] = useState<Partial<Record<BookingFlowStepId, string>>>({});
  const shouldScrollToErrorRef = useRef(false);

  const activeStepId = BOOKING_FLOW_STEPS[activeStepIndex]?.id ?? BOOKING_FLOW_STEPS[0].id;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === BOOKING_FLOW_STEPS.length - 1;
  const fieldErrors = form.formState.errors;

  const clearReservationHold = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(RESERVATION_HOLD_STORAGE_KEY);
    }
    setReservationHold(INITIAL_RESERVATION_HOLD_STATE);
  }, []);

  const mergeReservationHold = useCallback((next: Partial<ReservationHoldState>) => {
    setReservationHold((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!reservationHold.holdReference) {
      return;
    }
    window.sessionStorage.setItem(RESERVATION_HOLD_STORAGE_KEY, JSON.stringify(reservationHold));
  }, [reservationHold]);

  /** Restore hold from sessionStorage after paint so SSR + first client paint match. */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const restored = loadStoredReservationHold();
      if (!restored.holdReference) {
        return;
      }

      setReservationHold(restored);

      const rental = form.getValues("rental");
      const rentalPatch: Partial<BookingFlowState["rental"]> = {};
      const holdStillActive =
        restored.status === "ACTIVE" &&
        restored.expiresAt !== null &&
        new Date(restored.expiresAt).getTime() > Date.now();
      const holdMatchesVehicle =
        !restored.vehicleId || !rental.vehicleId || restored.vehicleId === rental.vehicleId;

      if (restored.vehicleId && !rental.vehicleId) {
        rentalPatch.vehicleId = restored.vehicleId;
      }
      if (restored.vehicleSlug && !rental.vehicleSlug) {
        rentalPatch.vehicleSlug = restored.vehicleSlug;
      }
      if (restored.vehicleType && !rental.vehicleType) {
        rentalPatch.vehicleType = restored.vehicleType;
      }
      if (restored.pickupDate && !rental.pickupDate) {
        rentalPatch.pickupDate = restored.pickupDate;
      }
      if (restored.pickupTime && !rental.pickupTime) {
        rentalPatch.pickupTime = restored.pickupTime;
      }
      if (restored.returnDate && !rental.returnDate) {
        rentalPatch.returnDate = restored.returnDate;
      }
      if (restored.returnTime && !rental.returnTime) {
        rentalPatch.returnTime = restored.returnTime;
      }
      if (restored.selectedColor && !rental.selectedColor) {
        rentalPatch.selectedColor = restored.selectedColor;
      }

      if (holdStillActive && holdMatchesVehicle) {
        if (restored.vehicleId) {
          rentalPatch.vehicleId = restored.vehicleId;
        }
        if (restored.vehicleSlug) {
          rentalPatch.vehicleSlug = restored.vehicleSlug;
        }
        if (restored.vehicleType) {
          rentalPatch.vehicleType = restored.vehicleType;
        }
        if (restored.pickupDate) {
          rentalPatch.pickupDate = restored.pickupDate;
        }
        if (restored.pickupTime) {
          rentalPatch.pickupTime = restored.pickupTime;
        }
        if (restored.returnDate) {
          rentalPatch.returnDate = restored.returnDate;
        }
        if (restored.returnTime) {
          rentalPatch.returnTime = restored.returnTime;
        }
        if (restored.selectedColor) {
          rentalPatch.selectedColor = restored.selectedColor;
        }
      }

      if (Object.keys(rentalPatch).length > 0) {
        const updatedRental = { ...rental, ...rentalPatch };
        form.setValue("rental", updatedRental, { shouldDirty: false, shouldValidate: false });

        const delivery = form.getValues("delivery");
        const deliveryReset = getPickupDeliveryResetForSunday(updatedRental.pickupDate, delivery);
        if (deliveryReset) {
          form.setValue(
            "delivery",
            { ...delivery, ...deliveryReset },
            { shouldDirty: false, shouldValidate: false },
          );
        }
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [form]);

  useEffect(() => {
    if (!shouldScrollToErrorRef.current) {
      return;
    }

    const firstPath = STEP_FIELD_PATHS[activeStepId].find(
      (fieldPath) => get(fieldErrors, fieldPath)?.message,
    );
    if (!firstPath) {
      return;
    }

    const element = document.querySelector(
      `[name="${firstPath}"], [data-field="${firstPath}"]`,
    ) as HTMLElement | null;

    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    shouldScrollToErrorRef.current = false;
  }, [activeStepId, fieldErrors]);

  const updateSection = useCallback(
    <K extends keyof BookingFlowState>(section: K, value: Partial<BookingFlowState[K]>) => {
      const currentSection = form.getValues(section);
      const nextSection = { ...currentSection, ...value };
      form.setValue(section, nextSection, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      const pickupDateToCheck =
        section === "rental" &&
        "pickupDate" in value &&
        typeof value.pickupDate === "string"
          ? value.pickupDate
          : section === "delivery" &&
              "pickupOption" in value &&
              value.pickupOption === "delivery"
            ? form.getValues("rental.pickupDate")
            : null;

      if (pickupDateToCheck) {
        const delivery = form.getValues("delivery");
        const deliveryReset = getPickupDeliveryResetForSunday(pickupDateToCheck, delivery);
        if (deliveryReset) {
          form.setValue(
            "delivery",
            { ...delivery, ...deliveryReset },
            {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            },
          );
        }
      }

      setStepErrors((prev) => {
        if (!prev[activeStepId]) {
          return prev;
        }

        const next = { ...prev };
        delete next[activeStepId];
        return next;
      });
    },
    [activeStepId, form],
  );

  const validateCurrentStep = useCallback(async () => {
    const fields = STEP_FIELD_PATHS[activeStepId];
    const isValid = await form.trigger(fields, { shouldFocus: true });
    const error = getStepFirstError(bookingFlowSchema, activeStepId, state);

    if (!isValid || error) {
      const message = error ?? tFlow("reviewFields");
      shouldScrollToErrorRef.current = true;
      setStepErrors((prev) => ({
        ...prev,
        [activeStepId]: message,
      }));
      return false;
    }

    setStepErrors((prev) => {
      if (!prev[activeStepId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[activeStepId];
      return next;
    });

    return true;
  }, [activeStepId, bookingFlowSchema, form, state, tFlow]);

  const goNext = useCallback(async () => {
    const valid = await validateCurrentStep();
    if (!valid) {
      return false;
    }

    setActiveStepIndex((prev) => Math.min(prev + 1, BOOKING_FLOW_STEPS.length - 1));
    return true;
  }, [validateCurrentStep]);

  const goBack = useCallback(() => {
    setActiveStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (stepId: BookingFlowStepId) => {
      if (!canAccessStep(bookingFlowSchema, stepId, state)) {
        return;
      }

      const nextIndex = BOOKING_FLOW_STEPS.findIndex((step) => step.id === stepId);
      if (nextIndex === -1) {
        return;
      }

      setActiveStepIndex(nextIndex);
    },
    [bookingFlowSchema, state],
  );

  const getFieldError = useCallback(
    (path: FieldPath<BookingFlowState>) => {
      const maybeError = get(fieldErrors, path) as
        | {
            message?: unknown;
          }
        | undefined;
      return typeof maybeError?.message === "string" ? maybeError.message : null;
    },
    [fieldErrors],
  );

  const isFieldInvalid = useCallback(
    (path: FieldPath<BookingFlowState>) => Boolean(get(fieldErrors, path)),
    [fieldErrors],
  );

  const getBookingValues = useCallback(() => form.getValues(), [form]);

  const applyConsentFromTermsModal = useCallback(
    (acceptedAtIso: string) => {
      const consent = form.getValues("consent");
      form.setValue(
        "consent",
        { ...consent, termsAccepted: true, termsAcceptedAt: acceptedAtIso },
        { shouldDirty: true, shouldValidate: true, shouldTouch: true },
      );
    },
    [form],
  );

  const clearServerFieldErrors = useCallback(() => {
    form.clearErrors([...SERVER_VALIDATED_PATHS]);
  }, [form]);

  const applyApiValidationErrors = useCallback(
    (errors: BookingApiValidationError[]) => {
      for (const err of errors) {
        const path = mapApiBookingErrorPathToFormPath(err.path);
        if (path) {
          form.setError(path, { type: "server", message: err.message });
        }
      }
    },
    [form],
  );

  const {
    createOrRefreshHold,
    releaseActiveHold,
  } = useReservationHold({
    bookingState: state,
    reservationHold,
    setHold: mergeReservationHold,
    clearHold: clearReservationHold,
    setError: setReservationHoldError,
  });

  const createOrRefreshReservationHold = useCallback(async () => {
    setIsCreatingHold(true);
    const result = await createOrRefreshHold();
    setIsCreatingHold(false);
    if (result.ok) {
      setReservationHoldError(null);
    } else if (result.message) {
      setReservationHoldError(result.message);
    }
    return result;
  }, [createOrRefreshHold]);

  const releaseReservationHold = useCallback(async () => {
    setIsReleasingHold(true);
    await releaseActiveHold();
    setIsReleasingHold(false);
    setReservationHoldError(null);
  }, [releaseActiveHold]);

  const markReservationHoldExpired = useCallback((message?: string) => {
    setReservationHold((prev) => ({
      ...prev,
      status: "EXPIRED",
      expiresAt: prev.expiresAt,
    }));
    setReservationHoldError(message ?? tFlow("holdExpiredDefault"));
  }, [tFlow]);

  const refreshReservationHoldFromServer = useCallback(async () => {
    if (!reservationHold.holdReference) {
      return;
    }
    const result = await getReservationHold(reservationHold.holdReference);
    if (!result.ok) {
      if (result.status === 404 || result.status === 409) {
        markReservationHoldExpired();
      }
      return;
    }
    mergeReservationHold({
      holdReference: result.data.holdReference,
      status: result.data.status,
      expiresAt: result.data.expiresAt,
      vehicleId: result.data.vehicleId,
      vehicleType: result.data.vehicleType,
    });
    if (result.data.status !== "ACTIVE") {
      setReservationHoldError(tFlow("holdExpiredDefault"));
    } else {
      setReservationHoldError(null);
    }
  }, [markReservationHoldExpired, mergeReservationHold, reservationHold.holdReference, tFlow]);

  useEffect(() => {
    if (!reservationHold.holdReference) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void refreshReservationHoldFromServer();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshReservationHoldFromServer, reservationHold.holdReference]);

  const resetBookingForm = useCallback(() => {
    form.reset(buildBookingInitialState(initialVehicleSlugRef.current, initialRentalRef.current));
    setBookingSessionId(createBookingSessionId());
    setStepErrors({});
    setActiveStepIndex(0);
    clearReservationHold();
    setReservationHoldError(null);
  }, [clearReservationHold, form]);

  const validateAllBookingFields = useCallback(() => form.trigger(), [form]);

  const setManualFieldError = useCallback(
    (path: FieldPath<BookingFlowState>, message: string) => {
      form.setError(path, { type: "manual", message });
    },
    [form],
  );

  const value = useMemo<BookingFlowContextValue>(
    () => ({
      bookingFlowSchema,
      state,
      reservationHold,
      reservationHoldError,
      isCreatingHold,
      isReleasingHold,
      activeStepIndex,
      activeStepId,
      stepErrors,
      fieldErrors,
      isFirstStep,
      isLastStep,
      bookingSessionId,
      updateSection,
      getFieldError,
      isFieldInvalid,
      goBack,
      goNext,
      goToStep,
      getBookingValues,
      applyConsentFromTermsModal,
      clearServerFieldErrors,
      applyApiValidationErrors,
      setReservationHoldError,
      updateReservationHold: mergeReservationHold,
      createOrRefreshReservationHold,
      releaseReservationHold,
      markReservationHoldExpired,
      refreshReservationHoldFromServer,
      clearReservationHold,
      resetBookingForm,
      validateCurrentStep,
      validateAllBookingFields,
      setManualFieldError,
    }),
    [
      bookingFlowSchema,
      state,
      reservationHold,
      reservationHoldError,
      isCreatingHold,
      isReleasingHold,
      activeStepIndex,
      activeStepId,
      stepErrors,
      fieldErrors,
      isFirstStep,
      isLastStep,
      bookingSessionId,
      updateSection,
      getFieldError,
      isFieldInvalid,
      goBack,
      goNext,
      goToStep,
      getBookingValues,
      applyConsentFromTermsModal,
      clearServerFieldErrors,
      applyApiValidationErrors,
      setReservationHoldError,
      mergeReservationHold,
      createOrRefreshReservationHold,
      releaseReservationHold,
      markReservationHoldExpired,
      refreshReservationHoldFromServer,
      clearReservationHold,
      resetBookingForm,
      validateCurrentStep,
      validateAllBookingFields,
      setManualFieldError,
    ],
  );

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>;
}

export function useBookingFlow() {
  const context = useContext(BookingFlowContext);
  if (!context) {
    throw new Error("useBookingFlow must be used within BookingFlowProvider");
  }
  return context;
}
