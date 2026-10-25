/**
 * Helmet sizes stored on bookings.
 *
 * `S` (Small) stays in the database enum so historical bookings still load.
 * New bookings may only select `BOOKABLE_HELMET_SIZES`.
 */
export const LEGACY_HELMET_SIZES = ["S"] as const;

export const BOOKABLE_HELMET_SIZES = ["M", "L", "XL"] as const;

export const STORED_HELMET_SIZES = ["S", "M", "L", "XL"] as const;

export type LegacyHelmetSize = (typeof LEGACY_HELMET_SIZES)[number];
export type BookableHelmetSize = (typeof BOOKABLE_HELMET_SIZES)[number];
export type StoredHelmetSize = (typeof STORED_HELMET_SIZES)[number];

export function isBookableHelmetSize(value: string): value is BookableHelmetSize {
  return (BOOKABLE_HELMET_SIZES as readonly string[]).includes(value);
}

export function isStoredHelmetSize(value: string): value is StoredHelmetSize {
  return (STORED_HELMET_SIZES as readonly string[]).includes(value);
}
