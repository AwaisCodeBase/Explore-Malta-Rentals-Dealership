import { NextResponse } from "next/server";

import {
  adminVehicleUnitCreateSchema,
  adminVehicleUnitUpdateSchema,
  createAdminVehicleUnit,
  DuplicateVehicleUnitLicensePlateError,
  listAdminVehicleUnits,
} from "@/lib/admin/vehicle-units";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
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
    const { id } = await context.params;
    const units = await listAdminVehicleUnits(id);

    return NextResponse.json({ success: true as const, units });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false as const, message: "Invalid request body" }, { status: 400 });
    }

    const parsed = adminVehicleUnitCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const unit = await createAdminVehicleUnit(id, parsed.data);
    if (!unit) {
      return NextResponse.json({ success: false as const, message: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true as const, unit }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof DuplicateVehicleUnitLicensePlateError) {
      return NextResponse.json({ success: false as const, message: error.message }, { status: 409 });
    }
    throw error;
  }
}
