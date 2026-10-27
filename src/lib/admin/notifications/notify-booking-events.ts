import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { notifyAdminSafe } from "@/lib/admin/notifications/create-admin-notification";

type BookingNotifyFields = {
  id: string;
  bookingReference: string;
  customerFullName: string;
  vehicleName: string;
};

function fromDetail(booking: AdminBookingDetail): BookingNotifyFields {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    customerFullName: booking.customerFullName,
    vehicleName: booking.vehicleName || "vehicle",
  };
}

export async function notifyBookingCreated(input: {
  bookingId: string;
  bookingReference: string;
  customerFullName: string;
  vehicleName: string;
}): Promise<void> {
  await notifyAdminSafe({
    type: "BOOKING_CREATED",
    title: `New booking ${input.bookingReference}`,
    message: `${input.customerFullName} booked ${input.vehicleName}.`,
    bookingId: input.bookingId,
    bookingReference: input.bookingReference,
    metadata: {
      customerFullName: input.customerFullName,
      vehicleName: input.vehicleName,
    },
  });
}

export async function notifyBookingCancelled(
  booking: AdminBookingDetail,
  adminUserId: string,
): Promise<void> {
  const fields = fromDetail(booking);
  await notifyAdminSafe({
    type: "BOOKING_CANCELLED",
    title: `Booking cancelled ${fields.bookingReference}`,
    message: `${fields.customerFullName}'s booking for ${fields.vehicleName} was cancelled.`,
    bookingId: fields.id,
    bookingReference: fields.bookingReference,
    createdByAdminId: adminUserId,
    metadata: {
      customerFullName: fields.customerFullName,
      vehicleName: fields.vehicleName,
    },
  });
}

export async function notifyPaymentReceived(input: {
  bookingId: string;
  bookingReference: string;
  customerFullName: string;
  vehicleName?: string | null;
  createdByAdminId?: string | null;
}): Promise<void> {
  const vehicleLabel = input.vehicleName?.trim() || "vehicle";
  await notifyAdminSafe({
    type: "PAYMENT_RECEIVED",
    title: `Payment received ${input.bookingReference}`,
    message: `Payment for ${input.customerFullName}'s ${vehicleLabel} booking is now paid.`,
    bookingId: input.bookingId,
    bookingReference: input.bookingReference,
    createdByAdminId: input.createdByAdminId ?? null,
    metadata: {
      customerFullName: input.customerFullName,
      vehicleName: vehicleLabel,
    },
  });
}

export async function notifyBookingExtended(
  booking: AdminBookingDetail,
  adminUserId: string,
): Promise<void> {
  const fields = fromDetail(booking);
  await notifyAdminSafe({
    type: "BOOKING_EXTENDED",
    title: `Booking extended ${fields.bookingReference}`,
    message: `Return date extended for ${fields.customerFullName}'s ${fields.vehicleName}.`,
    bookingId: fields.id,
    bookingReference: fields.bookingReference,
    createdByAdminId: adminUserId,
    metadata: {
      customerFullName: fields.customerFullName,
      vehicleName: fields.vehicleName,
      returnDateTime: booking.returnDateTime,
    },
  });
}

export async function notifyVehicleChanged(
  booking: AdminBookingDetail,
  adminUserId: string,
): Promise<void> {
  const fields = fromDetail(booking);
  await notifyAdminSafe({
    type: "VEHICLE_CHANGED",
    title: `Vehicle changed ${fields.bookingReference}`,
    message: `Vehicle for ${fields.customerFullName} changed to ${fields.vehicleName}.`,
    bookingId: fields.id,
    bookingReference: fields.bookingReference,
    createdByAdminId: adminUserId,
    metadata: {
      customerFullName: fields.customerFullName,
      vehicleName: fields.vehicleName,
      vehicleLicensePlate: booking.vehicleLicensePlate,
    },
  });
}

export async function notifyVehicleHandedOver(
  booking: AdminBookingDetail,
  adminUserId: string,
): Promise<void> {
  const fields = fromDetail(booking);
  await notifyAdminSafe({
    type: "VEHICLE_HANDED_OVER",
    title: `Vehicle handed over ${fields.bookingReference}`,
    message: `${fields.vehicleName} handed over to ${fields.customerFullName}.`,
    bookingId: fields.id,
    bookingReference: fields.bookingReference,
    createdByAdminId: adminUserId,
    metadata: {
      customerFullName: fields.customerFullName,
      vehicleName: fields.vehicleName,
      vehicleLicensePlate: booking.vehicleLicensePlate,
    },
  });
}

export async function notifyVehicleReplaced(
  booking: AdminBookingDetail,
  adminUserId: string,
): Promise<void> {
  const fields = fromDetail(booking);
  await notifyAdminSafe({
    type: "VEHICLE_REPLACED",
    title: `Vehicle replaced ${fields.bookingReference}`,
    message: `Mid-rental vehicle replaced with ${fields.vehicleName} for ${fields.customerFullName}.`,
    bookingId: fields.id,
    bookingReference: fields.bookingReference,
    createdByAdminId: adminUserId,
    metadata: {
      customerFullName: fields.customerFullName,
      vehicleName: fields.vehicleName,
      vehicleLicensePlate: booking.vehicleLicensePlate,
    },
  });
}

export async function notifyVehicleReturned(
  booking: AdminBookingDetail,
  adminUserId: string,
): Promise<void> {
  const fields = fromDetail(booking);
  await notifyAdminSafe({
    type: "VEHICLE_RETURNED",
    title: `Vehicle returned ${fields.bookingReference}`,
    message: `${fields.vehicleName} returned by ${fields.customerFullName}.`,
    bookingId: fields.id,
    bookingReference: fields.bookingReference,
    createdByAdminId: adminUserId,
    metadata: {
      customerFullName: fields.customerFullName,
      vehicleName: fields.vehicleName,
      vehicleLicensePlate: booking.vehicleLicensePlate,
    },
  });
}
