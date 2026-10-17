export function normalizeBrandKey(brand: string): string {
  return brand.trim().toLowerCase();
}

export function dedupeBrandLabels(
  brands: readonly (string | null | undefined)[],
): string[] {
  const byKey = new Map<string, string>();
  for (const raw of brands) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const key = normalizeBrandKey(trimmed);
    if (!byKey.has(key)) {
      byKey.set(key, trimmed);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function brandsMatch(left: string, right: string): boolean {
  return normalizeBrandKey(left) === normalizeBrandKey(right);
}

export function resolveBrandFilterLabel(
  raw: string | "All",
  availableBrands: readonly string[],
): string | "All" {
  if (raw === "All") return "All";
  const trimmed = raw.trim();
  if (!trimmed) return "All";
  const match = availableBrands.find((brand) => brandsMatch(brand, trimmed));
  return match ?? trimmed;
}
