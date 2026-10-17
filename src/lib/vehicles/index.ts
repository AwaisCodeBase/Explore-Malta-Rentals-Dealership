export { getVehicleBySlug } from "@/lib/vehicles/getVehicleBySlug";
export { getVehicles } from "@/lib/vehicles/getVehicles";
export {
  defaultEngineCcForVehicleType,
  formatEngineCcLabel,
  isEngineCcValue,
  isLicenseAllowedForEngine,
  normalizeEngineCc,
  vehicleTypeUsesEngineCc,
  ENGINE_CC_VALUES,
  type EngineCcValue,
} from "@/lib/vehicles/engine-cc";
export type {
  GetVehicleBySlugResult,
  GetVehiclesFilters,
  GetVehiclesResult,
  VehicleDetailDto,
  VehicleImageDto,
  VehicleListItemDto,
} from "@/lib/vehicles/types";
