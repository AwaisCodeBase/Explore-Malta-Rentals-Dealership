import { randomBytes } from "node:crypto";
import { format } from "date-fns";
import { z } from "zod";

import { Prisma, VehicleType, type ReservationHoldStatus } from "@/generated/prisma/index";
import {
  colorsMatch,
  normalizeVehicleColorForStorage,
  parseVehicleColorValue,
} from "@/features/vehicles/lib/vehicle-color";
import { checkVehicleAvailability } from "@/lib/availability";
import { assignAvailableVehicleUnit } from "@/lib/vehicle-units";
import { vehicleHasColoredUnits } from "@/lib/vehicle-units/getAvailableColorsForVehicle";
import {
  deleteOccupancyForHold,
  insertHoldOccupancy,
  isVehicleUnitOccupancyExclusionError,
} from "@/lib/vehicle-unit-occupancy";
import { combineDateAndTime } from "@/lib/booking/bookingSubmissionSchema";
import { prisma } from "@/lib/prisma";

export const HOLD_DURATION_MS = 15 * 60 * 1000;
/** Extra hold time once the customer reaches review / terms / payment. */
export const CHECKOUT_HOLD_EXTENSION_MS = 15 * 60 * 1000;
const HOLD_REFERENCE_PREFIX = "HLD";
const HOLD_REFERENCE_RETRY_LIMIT = 5;

type ValidationError = {
  path: string;
  message: string;
};

type ReservationHoldRecord = {
  id: string;
  holdReference: string;
  vehicleId: string;
  vehicleUnitId: string | null;
  selectedColor: string | null;
  vehicleType: VehicleType;
  sessionKey: string;
  customerEmail: string | null;
  customerName: string | null;
  pickupDateTime: Date;
  returnDateTime: Date;
  status: ReservationHoldStatus;
  reservedAt: Date;
  expiresAt: Date;
  lastHeartbeatAt: Date | null;
  bookingId: string | null;
};

const createReservationHoldSchema = z
  .object({
    vehicleId: z.string().trim().min(1, "vehicleId is required"),
    vehicleType: z.nativeEnum(VehicleType).optional(),
    pickupDate: z.string().trim().min(1, "pickupDate is required"),
    pickupTime: z.string().trim().min(1, "pickupTime is required"),
    returnDate: z.string().trim().min(1, "returnDate is required"),
    returnTime: z.string().trim().min(1, "returnTime is required"),
    color: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    sessionKey: z.string().trim().min(1).max(120).optional(),
    customerEmail: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined))
      .pipe(z.string().email().optional()),
    customerName: z.string().trim().min(1).max(160).optional(),
  })
  .strict();

type CreateReservationHoldInput = z.infer<typeof createReservationHoldSchema> & {
  pickupDateTime: Date;
  returnDateTime: Date;
  selectedColor: string | null;
};

function formatIssuePath(path: (string | number)[]): string {
  return path.map((segment) => String(segment)).join(".");
}

export class ReservationHoldValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super("Reservation hold payload validation failed");
    this.name = "ReservationHoldValidationError";
    this.errors = errors;
  }
}

export class ReservationHoldConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationHoldConflictError";
  }
}

export class ReservationHoldStateError extends Error {
  readonly holdStatus: ReservationHoldStatus;

  constructor(message: string, holdStatus: ReservationHoldStatus) {
    super(message);
    this.name = "ReservationHoldStateError";
    this.holdStatus = holdStatus;
  }
}

export function generateSessionKey(): string {
  return randomBytes(16).toString("hex");
}

function generateHoldReference(now = new Date()): string {
  return `${HOLD_REFERENCE_PREFIX}-${format(now, "yyyyMMdd")}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function getExpiryFrom(now = new Date()): Date {
  return new Date(now.getTime() + HOLD_DURATION_MS);
}

export function isHoldExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

function normalizeCreateInput(payload: unknown): CreateReservationHoldInput {
  const parsed = createReservationHoldSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ReservationHoldValidationError(
      parsed.error.issues.map((issue) => ({
        path: formatIssuePath(issue.path),
        message: issue.message,
      })),
    );
  }

  const pickupDateTime = combineDateAndTime(parsed.data.pickupDate, parsed.data.pickupTime);
  const returnDateTime = combineDateAndTime(parsed.data.returnDate, parsed.data.returnTime);
  if (!pickupDateTime || !returnDateTime || pickupDateTime >= returnDateTime) {
    throw new ReservationHoldValidationError([
      {
        path: "pickupDate",
        message: "Invalid pickup/return date range",
      },
    ]);
  }

  return {
    ...parsed.data,
    pickupDateTime,
    returnDateTime,
    selectedColor: parsed.data.color
      ? normalizeVehicleColorForStorage(parsed.data.color)
      : null,
  };
}

function toReservationHoldResponse(hold: ReservationHoldRecord, now = new Date()) {
  const status = hold.status === "ACTIVE" && isHoldExpired(hold.expiresAt, now) ? "EXPIRED" : hold.status;
  const remainingMs = Math.max(0, hold.expiresAt.getTime() - now.getTime());

  return {
    holdReference: hold.holdReference,
    sessionKey: hold.sessionKey,
    status,
    expiresAt: hold.expiresAt,
    reservedAt: hold.reservedAt,
    lastHeartbeatAt: hold.lastHeartbeatAt,
    pickupDateTime: hold.pickupDateTime,
    returnDateTime: hold.returnDateTime,
    vehicleId: hold.vehicleId,
    vehicleType: hold.vehicleType,
    selectedColor: hold.selectedColor,
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}

async function expireHoldWhenStale(holdId: string, db: Prisma.TransactionClient | typeof prisma): Promise<void> {
  await db.reservationHold.updateMany({
    where: {
      id: holdId,
      status: "ACTIVE",
      expiresAt: { lte: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });
  await deleteOccupancyForHold(db, holdId);
}

const holdSelect = {
  id: true,
  holdReference: true,
  vehicleId: true,
  vehicleUnitId: true,
  selectedColor: true,
  vehicleType: true,
  sessionKey: true,
  customerEmail: true,
  customerName: true,
  pickupDateTime: true,
  returnDateTime: true,
  status: true,
  reservedAt: true,
  expiresAt: true,
  lastHeartbeatAt: true,
  bookingId: true,
} satisfies Prisma.ReservationHoldSelect;

async function createHoldWithUniqueReference(
  input: CreateReservationHoldInput,
  sessionKey: string,
  vehicleUnitId: string,
  vehicleType: VehicleType,
  selectedColor: string | null,
  db: Prisma.TransactionClient,
): Promise<ReservationHoldRecord> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < HOLD_REFERENCE_RETRY_LIMIT; attempt += 1) {
    const holdReference = generateHoldReference();
    try {
      return await db.reservationHold.create({
        data: {
          holdReference,
          vehicleId: input.vehicleId,
          vehicleUnitId,
          selectedColor,
          vehicleType,
          sessionKey,
          customerEmail: input.customerEmail ?? null,
          customerName: input.customerName ?? null,
          pickupDateTime: input.pickupDateTime,
          returnDateTime: input.returnDateTime,
          status: "ACTIVE",
          reservedAt: new Date(),
          expiresAt: getExpiryFrom(),
        },
        select: holdSelect,
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to generate hold reference");
}

const HOLD_TRANSACTION_RETRY_LIMIT = 3;
const HOLD_TRANSACTION_RETRY_DELAYS_MS = [150, 400, 900];

function isTransactionStartTimeout(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028";
}

async function waitForHoldRetry(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runCreateReservationHoldTransaction(
  input: CreateReservationHoldInput,
  sessionKey: string,
): Promise<ReservationHoldRecord> {
  return prisma.$transaction(
    async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { id: true, vehicleType: true, isActive: true },
      });
      if (!vehicle) {
        throw new ReservationHoldValidationError([{ path: "vehicleId", message: "Vehicle not found" }]);
      }
      if (!vehicle.isActive) {
        throw new ReservationHoldValidationError([
          { path: "vehicleId", message: "Selected vehicle is not active" },
        ]);
      }

      const resolvedVehicleType = vehicle.vehicleType;
      const hasColoredUnits = await vehicleHasColoredUnits(input.vehicleId, tx);

      if (hasColoredUnits && !input.selectedColor) {
        throw new ReservationHoldValidationError([
          { path: "color", message: "Color selection is required for this vehicle" },
        ]);
      }

      if (input.selectedColor && !parseVehicleColorValue(input.selectedColor)) {
        throw new ReservationHoldValidationError([
          { path: "color", message: "Invalid color selection" },
        ]);
      }

      const reusableHold = await tx.reservationHold.findFirst({
        where: {
          sessionKey,
          vehicleId: input.vehicleId,
          pickupDateTime: input.pickupDateTime,
          returnDateTime: input.returnDateTime,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: holdSelect,
      });

      if (reusableHold) {
        const colorMatches =
          !input.selectedColor && !reusableHold.selectedColor
            ? true
            : colorsMatch(input.selectedColor, reusableHold.selectedColor);

        if (colorMatches) {
          return tx.reservationHold.update({
            where: { id: reusableHold.id },
            data: {
              expiresAt: getExpiryFrom(),
              lastHeartbeatAt: new Date(),
              customerEmail: input.customerEmail ?? reusableHold.customerEmail,
              customerName: input.customerName ?? reusableHold.customerName,
            },
            select: holdSelect,
          });
        }

        await tx.reservationHold.update({
          where: { id: reusableHold.id },
          data: { status: "RELEASED" },
        });
        await deleteOccupancyForHold(tx, reusableHold.id);
      }

      const availabilityColor = input.selectedColor
        ? parseVehicleColorValue(input.selectedColor) ?? undefined
        : undefined;

      const availability = await checkVehicleAvailability(
        {
          vehicleId: input.vehicleId,
          vehicleType: resolvedVehicleType,
          requestedStart: input.pickupDateTime,
          requestedEnd: input.returnDateTime,
          color: availabilityColor,
          excludeSessionKey: sessionKey,
        },
        tx,
        tx,
      );
      if (!availability.isAvailable) {
        const message = input.selectedColor
          ? `The selected color is no longer available for the chosen dates`
          : (availability.reason ?? "Selected vehicle is not available for the chosen dates");
        throw new ReservationHoldConflictError(message);
      }

      const assignedUnit = await assignAvailableVehicleUnit(
        {
          vehicleId: input.vehicleId,
          requestedStart: input.pickupDateTime,
          requestedEnd: input.returnDateTime,
          color: availabilityColor,
          excludeSessionKey: sessionKey,
        },
        tx,
      );

      return createHoldWithUniqueReference(
        input,
        sessionKey,
        assignedUnit.vehicleUnitId,
        resolvedVehicleType,
        input.selectedColor,
        tx,
      ).then(async (hold) => {
        try {
          await insertHoldOccupancy(tx, {
            vehicleUnitId: assignedUnit.vehicleUnitId,
            pickupAt: input.pickupDateTime,
            returnAt: input.returnDateTime,
            reservationHoldId: hold.id,
          });
        } catch (occupancyError) {
          if (isVehicleUnitOccupancyExclusionError(occupancyError)) {
            const message = input.selectedColor
              ? "The selected color is no longer available for the chosen dates"
              : "Selected vehicle is not available for the chosen dates";
            throw new ReservationHoldConflictError(message);
          }
          throw occupancyError;
        }
        return hold;
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 30_000,
    },
  );
}

export async function createReservationHold(payload: unknown) {
  const input = normalizeCreateInput(payload);
  const sessionKey = input.sessionKey ?? generateSessionKey();

  let lastError: unknown = null;
  for (let attempt = 0; attempt < HOLD_TRANSACTION_RETRY_LIMIT; attempt += 1) {
    if (attempt > 0) {
      await waitForHoldRetry(HOLD_TRANSACTION_RETRY_DELAYS_MS[attempt - 1] ?? 1200);
    }

    try {
      const hold = await runCreateReservationHoldTransaction(input, sessionKey);
      return toReservationHoldResponse(hold);
    } catch (error) {
      if (isTransactionStartTimeout(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Unable to create reservation hold");
}

export async function getReservationHoldByReference(holdReference: string) {
  const hold = await prisma.reservationHold.findUnique({
    where: { holdReference },
    select: holdSelect,
  });
  if (!hold) {
    return null;
  }

  if (hold.status === "ACTIVE" && isHoldExpired(hold.expiresAt)) {
    await expireHoldWhenStale(hold.id, prisma);
    return {
      ...hold,
      status: "EXPIRED" as const,
    };
  }

  return hold;
}

export async function heartbeatReservationHold(holdReference: string) {
  const hold = await getReservationHoldByReference(holdReference);
  if (!hold) {
    throw new ReservationHoldStateError("Reservation hold was not found", "EXPIRED");
  }
  if (hold.status !== "ACTIVE") {
    throw new ReservationHoldStateError("Reservation hold is no longer active", hold.status);
  }

  const updated = await prisma.reservationHold.update({
    where: { id: hold.id },
    data: { lastHeartbeatAt: new Date() },
    select: holdSelect,
  });

  return toReservationHoldResponse(updated);
}

/**
 * Guarantees ~15 more minutes on an active hold when the customer reaches
 * review / terms / payment so checkout is not cut off mid-flow.
 */
export async function extendReservationHoldForCheckout(holdReference: string) {
  const hold = await getReservationHoldByReference(holdReference);
  if (!hold) {
    throw new ReservationHoldStateError("Reservation hold was not found", "EXPIRED");
  }
  if (hold.status !== "ACTIVE") {
    throw new ReservationHoldStateError("Reservation hold is no longer active", hold.status);
  }

  const now = new Date();
  const checkoutExpiresAt = new Date(now.getTime() + CHECKOUT_HOLD_EXTENSION_MS);
  const expiresAt =
    hold.expiresAt.getTime() > checkoutExpiresAt.getTime() ? hold.expiresAt : checkoutExpiresAt;

  const updated = await prisma.reservationHold.update({
    where: { id: hold.id },
    data: {
      expiresAt,
      lastHeartbeatAt: now,
    },
    select: holdSelect,
  });

  return toReservationHoldResponse(updated);
}

export async function releaseReservationHold(holdReference: string) {
  const hold = await getReservationHoldByReference(holdReference);
  if (!hold) {
    return { released: false, hold: null };
  }

  if (hold.status !== "ACTIVE") {
    return { released: false, hold: toReservationHoldResponse(hold) };
  }

  const updated = await prisma.reservationHold.update({
    where: { id: hold.id },
    data: { status: "RELEASED" },
    select: holdSelect,
  });
  await deleteOccupancyForHold(prisma, hold.id);

  return {
    released: true,
    hold: toReservationHoldResponse(updated),
  };
}

export function toReservationHoldStatusResponse(hold: ReservationHoldRecord) {
  return toReservationHoldResponse(hold);
}

export { cleanupExpiredHolds, type CleanupExpiredHoldsResult } from "@/lib/reservation-holds/cleanupExpiredHolds";
export { releaseStaleHoldOccupancy } from "@/lib/reservation-holds/releaseStaleHoldOccupancy";
