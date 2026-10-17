export { assignAvailableVehicleUnit, NoAvailableVehicleUnitError } from "@/lib/vehicle-units/assignAvailableVehicleUnit";
export { batchGetAvailableColorsForVehicles } from "@/lib/vehicle-units/batchGetAvailableColorsForVehicles";
export {
  batchFindAvailableVehicleUnits,
  findAvailableVehicleUnits,
} from "@/lib/vehicle-units/findAvailableVehicleUnits";
export {
  getAvailableColorsForVehicle,
  getUnitColorsForVehicle,
  vehicleHasColoredUnits,
} from "@/lib/vehicle-units/getAvailableColorsForVehicle";
export { isAssignableVehicleUnit } from "@/lib/vehicle-units/isAssignableVehicleUnit";
export {
  ASSIGNABLE_VEHICLE_UNIT_STATUSES,
  type AssignVehicleUnitInput,
  type AssignVehicleUnitResult,
  type AvailableColorDto,
  type FindAvailableVehicleUnitsInput,
  type VehicleUnitRecord,
} from "@/lib/vehicle-units/types";
