import { NextResponse } from "next/server";

import {
  adminVehicleUnitUpdateSchema,
  deleteAdminVehicleUnit,
  DuplicateVehicleUnitLicensePlateError,
  VehicleUnitHasActiveBookingError,
  getAdminVehicleUnitDetail,
  updateAdminVehicleUnit,
} from "@/lib/admin/vehicle-units";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string; unitId: string }>;
};

function formatZodError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const fieldErrors = error.flatten().fieldErrors;
  const firstKey = Object.keys(fieldErrors)[0];
  const firstMessage = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
  return firstMessage ?? "Invalid request";
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id, unitId } = await context.params;
    const unit = await getAdminVehicleUnitDetail(id, unitId);

    if (!unit) {
      return NextResponse.json({ success: false as const, message: "Vehicle unit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true as const, unit });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id, unitId } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false as const, message: "Invalid request body" }, { status: 400 });
    }

    const parsed = adminVehicleUnitUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const unit = await updateAdminVehicleUnit(id, unitId, parsed.data);
    if (!unit) {
      return NextResponse.json({ success: false as const, message: "Vehicle unit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true as const, unit });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof DuplicateVehicleUnitLicensePlateError) {
      return NextResponse.json({ success: false as const, message: error.message }, { status: 409 });
    }
    if (error instanceof VehicleUnitHasActiveBookingError) {
      return NextResponse.json({ success: false as const, message: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id, unitId } = await context.params;
    const result = await deleteAdminVehicleUnit(id, unitId);

    if (!result.ok) {
      if (result.reason === "has_related_records") {
        return NextResponse.json(
          {
            success: false as const,
            message:
              "This unit has booking or hold history and cannot be deleted. Deactivate it instead.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ success: false as const, message: "Vehicle unit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true as const });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
