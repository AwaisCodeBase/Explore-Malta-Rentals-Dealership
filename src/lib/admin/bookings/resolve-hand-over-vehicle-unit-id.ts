/**
 * After Change Vehicle, soft refresh can leave the handover form holding the old unit id.
 * Prefer the booking's current unit, then the first selectable unit of the current model.
 */
export function resolveHandOverVehicleUnitId(input: {
  formVehicleUnitId: string;
  bookingVehicleUnitId: string | null;
  selectableUnitIds: readonly string[];
}): string {
  if (input.formVehicleUnitId && input.selectableUnitIds.includes(input.formVehicleUnitId)) {
    return input.formVehicleUnitId;
  }
  if (input.bookingVehicleUnitId && input.selectableUnitIds.includes(input.bookingVehicleUnitId)) {
    return input.bookingVehicleUnitId;
  }
  return input.selectableUnitIds[0] ?? "";
}
