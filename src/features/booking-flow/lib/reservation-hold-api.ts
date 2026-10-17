"use client";

import type { ReservationHoldStatus } from "@/features/booking-flow/lib/types";

export type CreateReservationHoldPayload = {
  vehicleId: string;
  vehicleType?: string;
  color?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  sessionKey?: string;
  customerEmail?: string;
  customerName?: string;
};

type HoldSuccessBase = {
  success: true;
  holdReference: string;
  status: ReservationHoldStatus;
  expiresAt: string;
};

export type CreateHoldSuccess = HoldSuccessBase & {
  sessionKey: string;
  message?: string;
};

export type HeartbeatHoldSuccess = HoldSuccessBase & {
  message?: string;
};

export type GetHoldSuccess = HoldSuccessBase & {
  reservedAt: string;
  remainingSeconds: number;
  vehicleId: string;
  vehicleType: string;
};

type HoldFailure = {
  success: false;
  message?: string;
  errors?: Array<{ path?: string; message?: string }>;
  status?: ReservationHoldStatus;
};

function extractHoldFailureMessage(body: HoldFailure | null, response: Response, fallback: string): string {
  if (body?.message && typeof body.message === "string") {
    return body.message;
  }
  const firstValidationError = body?.errors?.find((error) => typeof error.message === "string")?.message;
  if (firstValidationError) {
    return firstValidationError;
  }
  return fallbackMessage(response, fallback);
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function fallbackMessage(response: Response, fallback: string): string {
  if (response.status === 409) {
    return "This vehicle is currently reserved or unavailable for the selected dates";
  }
  return fallback;
}

export async function createReservationHold(
  payload: CreateReservationHoldPayload,
): Promise<{ ok: true; data: CreateHoldSuccess } | { ok: false; status: number; message: string }> {
  const response = await fetch("/api/reservation-holds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await parseJson(response)) as CreateHoldSuccess | HoldFailure | null;

  if (!response.ok || !body || body.success !== true) {
    return {
      ok: false,
      status: response.status,
      message: extractHoldFailureMessage(body as HoldFailure | null, response, "Unable to reserve this vehicle right now."),
    };
  }

  return { ok: true, data: body };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isTransientHoldCreateFailure(status: number): boolean {
  return status === 500 || status === 503 || status === 429 || status === 0;
}

const HOLD_CREATE_RETRY_ATTEMPTS = 3;
const HOLD_CREATE_RETRY_DELAYS_MS = [400, 900];

/**
 * Retries hold creation on transient server / DB contention (e.g. Prisma P2028 surfaced as 500).
 */
export async function createReservationHoldWithRetry(
  payload: CreateReservationHoldPayload,
): Promise<{ ok: true; data: CreateHoldSuccess } | { ok: false; status: number; message: string }> {
  let last: { ok: true; data: CreateHoldSuccess } | { ok: false; status: number; message: string } = {
    ok: false,
    status: 0,
    message: "Unable to reserve this vehicle right now.",
  };

  for (let attempt = 0; attempt < HOLD_CREATE_RETRY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await waitMs(HOLD_CREATE_RETRY_DELAYS_MS[attempt - 1] ?? 1200);
    }
    last = await createReservationHold(payload);
    if (last.ok) {
      return last;
    }
    if (!isTransientHoldCreateFailure(last.status)) {
      return last;
    }
  }

  return last;
}

export async function heartbeatReservationHold(
  holdReference: string,
): Promise<{ ok: true; data: HeartbeatHoldSuccess } | { ok: false; status: number; message: string; holdStatus?: ReservationHoldStatus }> {
  const response = await fetch(`/api/reservation-holds/${encodeURIComponent(holdReference)}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const body = (await parseJson(response)) as HeartbeatHoldSuccess | HoldFailure | null;

  if (!response.ok || !body || body.success !== true) {
    return {
      ok: false,
      status: response.status,
      message:
        (body && "message" in body && typeof body.message === "string" && body.message) ||
        "Unable to refresh reservation hold right now.",
      holdStatus: body && "status" in body ? body.status : undefined,
    };
  }

  return { ok: true, data: body };
}

/** Extends an active hold so the customer has ~15 minutes for review / terms / payment. */
export async function extendReservationHoldForCheckout(
  holdReference: string,
): Promise<{ ok: true; data: HeartbeatHoldSuccess } | { ok: false; status: number; message: string; holdStatus?: ReservationHoldStatus }> {
  const response = await fetch(
    `/api/reservation-holds/${encodeURIComponent(holdReference)}/extend-checkout`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  const body = (await parseJson(response)) as HeartbeatHoldSuccess | HoldFailure | null;

  if (!response.ok || !body || body.success !== true) {
    return {
      ok: false,
      status: response.status,
      message:
        (body && "message" in body && typeof body.message === "string" && body.message) ||
        "Unable to extend reservation hold for checkout.",
      holdStatus: body && "status" in body ? body.status : undefined,
    };
  }

  return { ok: true, data: body };
}

export async function releaseReservationHold(
  holdReference: string,
): Promise<{ ok: true; status?: ReservationHoldStatus } | { ok: false; message: string }> {
  const response = await fetch(`/api/reservation-holds/${encodeURIComponent(holdReference)}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const body = (await parseJson(response)) as
    | { success: true; status?: ReservationHoldStatus }
    | HoldFailure
    | null;

  if (!response.ok || !body || body.success !== true) {
    return {
      ok: false,
      message:
        (body && "message" in body && typeof body.message === "string" && body.message) ||
        "Unable to release reservation hold right now.",
    };
  }

  return { ok: true, status: body.status };
}

export async function getReservationHold(
  holdReference: string,
): Promise<{ ok: true; data: GetHoldSuccess } | { ok: false; status: number; message: string }> {
  const response = await fetch(`/api/reservation-holds/${encodeURIComponent(holdReference)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = (await parseJson(response)) as GetHoldSuccess | HoldFailure | null;

  if (!response.ok || !body || body.success !== true) {
    return {
      ok: false,
      status: response.status,
      message:
        (body && "message" in body && typeof body.message === "string" && body.message) ||
        "Unable to fetch reservation hold.",
    };
  }

  return { ok: true, data: body };
}
