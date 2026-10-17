"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { normalizeHotelCode } from "@/lib/hotel-codes/normalize-hotel-code";

type ValidateResponse =
  | {
      success: true;
      valid: true;
      code: string;
      discountPercent: number;
      partnerName: string;
    }
  | {
      success: false;
      valid: false;
      message: string;
    };

export function HotelCodeField() {
  const t = useTranslations("BookingWizard.hotelCode");
  const { state, updateSection } = useBookingFlow();
  const [isValidating, setIsValidating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateCode = useCallback(
    async (rawCode: string) => {
      const normalized = normalizeHotelCode(rawCode);
      if (!normalized) {
        updateSection("hotelCode", {
          code: rawCode,
          appliedCode: null,
          discountPercent: null,
          partnerName: null,
          error: null,
        });
        return;
      }

      setIsValidating(true);
      try {
        const response = await fetch("/api/hotel-codes/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: normalized }),
        });
        const payload = (await response.json()) as ValidateResponse;

        if (!response.ok || !payload.success || !payload.valid) {
          updateSection("hotelCode", {
            code: normalized,
            appliedCode: null,
            discountPercent: null,
            partnerName: null,
            error: payload.success === false ? payload.message : t("invalidGeneric"),
          });
          return;
        }

        updateSection("hotelCode", {
          code: normalized,
          appliedCode: payload.code,
          discountPercent: payload.discountPercent,
          partnerName: payload.partnerName,
          error: null,
        });
      } catch {
        updateSection("hotelCode", {
          code: normalized,
          appliedCode: null,
          discountPercent: null,
          partnerName: null,
          error: t("validateFailed"),
        });
      } finally {
        setIsValidating(false);
      }
    },
    [t, updateSection],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleChange(value: string) {
    updateSection("hotelCode", {
      code: value,
      appliedCode: null,
      discountPercent: null,
      partnerName: null,
      error: null,
    });

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void validateCode(value);
    }, 450);
  }

  function handleBlur() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void validateCode(state.hotelCode.code);
  }

  return (
    <div className="surface-card p-4 sm:p-5">
      <label
        htmlFor="booking-hotel-code"
        className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]"
      >
        {t("label")}
      </label>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{t("description")}</p>
      <div className="relative mt-3 max-w-sm">
        <input
          id="booking-hotel-code"
          type="text"
          value={state.hotelCode.code}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={handleBlur}
          autoComplete="off"
          spellCheck={false}
          placeholder={t("placeholder")}
          aria-invalid={state.hotelCode.error ? true : undefined}
          aria-describedby={state.hotelCode.error ? "booking-hotel-code-error" : undefined}
          className={`min-h-12 w-full rounded-[var(--r-field)] border bg-[var(--surface-card)] px-3.5 py-2.5 pr-10 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--text-primary)] shadow-[var(--elev-1)] outline-none transition duration-[var(--dur-fast)] placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--text-faint)] ${
            state.hotelCode.error
              ? "border-red-400 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500/25"
              : "border-[var(--line)] hover:border-[var(--line-strong)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
          }`}
        />
        {isValidating ? (
          <Loader2
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-[var(--text-faint)]"
            aria-hidden
          />
        ) : null}
      </div>
      {state.hotelCode.error ? (
        <p
          id="booking-hotel-code-error"
          className="mt-2 text-sm font-medium text-red-600"
          role="alert"
        >
          {state.hotelCode.error}
        </p>
      ) : null}
      {state.hotelCode.appliedCode && state.hotelCode.discountPercent != null ? (
        <p
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200"
          role="status"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          {t("applied", {
            percent: state.hotelCode.discountPercent,
            hotel: state.hotelCode.partnerName ?? "",
          })}
        </p>
      ) : null}
    </div>
  );
}
