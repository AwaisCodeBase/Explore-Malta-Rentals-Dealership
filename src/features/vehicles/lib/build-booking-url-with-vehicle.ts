export function buildBookingUrlWithVehicle(
  baseHref: string,
  vehicleSlug: string,
  selectedColor?: string | null,
): string {
  const [path, query] = baseHref.split("?");
  const params = new URLSearchParams(query ?? "");
  params.set("vehicle", vehicleSlug);
  const color = selectedColor?.trim();
  if (color) {
    params.set("color", color);
  }
  const qs = params.toString();
  return qs.length > 0 ? `${path}?${qs}` : path;
}
