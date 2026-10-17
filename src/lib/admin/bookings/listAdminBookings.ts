import type { Prisma } from "@/generated/prisma/index";

import type {
  AdminBookingListFilters,
  AdminBookingListItem,
  AdminBookingListResult,
  AdminBookingVehicleOption,
} from "@/lib/admin/bookings/types";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 25;

function normalizeSearchTerm(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function monthRangeUtc(month: number, year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function buildBookingWhere(filters: AdminBookingListFilters): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {};
  const search = normalizeSearchTerm(filters.search);

  if (search) {
    where.OR = [
      { bookingReference: { contains: search, mode: "insensitive" } },
      { customerFullName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  if (filters.hotelPartnerId) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { hotelPartnerId: filters.hotelPartnerId },
          { hotelCode: { hotelPartnerId: filters.hotelPartnerId } },
        ],
      },
    ];
  }

  if (filters.hotelCode) {
    where.hotelCodeSnapshot = { equals: filters.hotelCode, mode: "insensitive" };
  }

  if (filters.month !== undefined && filters.year !== undefined) {
    const { start, end } = monthRangeUtc(filters.month, filters.year);
    where.createdAt = { gte: start, lt: end };
  } else if (filters.year !== undefined) {
    where.createdAt = {
      gte: new Date(Date.UTC(filters.year, 0, 1)),
      lt: new Date(Date.UTC(filters.year + 1, 0, 1)),
    };
  }

  if (filters.pickupFrom || filters.pickupTo) {
    const pickupFilter: Prisma.DateTimeFilter = {};
    if (filters.pickupFrom) {
      pickupFilter.gte = new Date(`${filters.pickupFrom}T00:00:00.000Z`);
    }
    if (filters.pickupTo) {
      pickupFilter.lte = new Date(`${filters.pickupTo}T23:59:59.999Z`);
    }
    where.pickupDateTime = pickupFilter;
  }

  return where;
}

const listSelect = {
  id: true,
  bookingReference: true,
  customerFullName: true,
  customerEmail: true,
  customerPhone: true,
  vehicleNameSnapshot: true,
  vehicleLicensePlateSnapshot: true,
  pickupDateTime: true,
  returnDateTime: true,
  status: true,
  paymentStatus: true,
  depositMethod: true,
  depositAmount: true,
  totalDueOnline: true,
  totalDueLater: true,
  subtotal: true,
  hotelCodeSnapshot: true,
  hotelPartnerNameSnapshot: true,
  createdAt: true,
} as const;

function mapListItem(booking: {
  id: string;
  bookingReference: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleNameSnapshot: string | null;
  vehicleLicensePlateSnapshot: string | null;
  pickupDateTime: Date;
  returnDateTime: Date;
  status: AdminBookingListItem["status"];
  paymentStatus: AdminBookingListItem["paymentStatus"];
  depositMethod: AdminBookingListItem["depositMethod"];
  depositAmount: { toNumber: () => number };
  totalDueOnline: { toNumber: () => number };
  totalDueLater: { toNumber: () => number };
  subtotal: { toNumber: () => number };
  hotelCodeSnapshot: string | null;
  hotelPartnerNameSnapshot: string | null;
  createdAt: Date;
}): AdminBookingListItem {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    customerFullName: booking.customerFullName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    vehicleName: booking.vehicleNameSnapshot ?? "—",
    vehicleLicensePlate: booking.vehicleLicensePlateSnapshot,
    pickupDateTime: booking.pickupDateTime.toISOString(),
    returnDateTime: booking.returnDateTime.toISOString(),
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    depositMethod: booking.depositMethod,
    depositAmount: booking.depositAmount.toNumber(),
    totalDueOnline: booking.totalDueOnline.toNumber(),
    totalDueLater: booking.totalDueLater.toNumber(),
    subtotal: booking.subtotal.toNumber(),
    hotelCode: booking.hotelCodeSnapshot,
    hotelName: booking.hotelPartnerNameSnapshot,
    createdAt: booking.createdAt.toISOString(),
  };
}

export async function listAdminBookings(
  filters: AdminBookingListFilters = {},
): Promise<AdminBookingListResult> {
  const where = buildBookingWhere(filters);
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
      select: listSelect,
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: bookings.map(mapListItem),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function listAdminBookingVehicleOptions(): Promise<AdminBookingVehicleOption[]> {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
    },
  });

  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    licensePlate: null,
  }));
}
