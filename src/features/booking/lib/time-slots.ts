/** 30-minute slots — European-style 24h labels */
export const TIME_SLOTS: readonly string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
    }
  }
  return out;
})();

/** Pickup / drop-off window for shop bookings: 09:30–19:00 (30-minute steps). */
export const BOOKING_TIME_SLOTS: readonly string[] = (() => {
  const out: string[] = [];
  for (let t = 9 * 60 + 30; t <= 19 * 60; t += 30) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    out.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
  return out;
})();

/** Stable default for SSR/hydration; pair with {@link nextBookingSlotWithinHours} after mount. */
export const BOOKING_PICKUP_TIME_FALLBACK = BOOKING_TIME_SLOTS[0] ?? "09:30";

/** Next booking slot at least `bufferMinutes` ahead, restricted to {@link BOOKING_TIME_SLOTS}. */
export function nextBookingSlotWithinHours(bufferMinutes = 90): string {
  const slots = BOOKING_TIME_SLOTS;
  const d = new Date();
  d.setMinutes(d.getMinutes() + bufferMinutes, 0, 0);
  const target = d.getHours() * 60 + d.getMinutes();
  for (const s of slots) {
    const [h, m] = s.split(":").map(Number);
    const slotMins = h! * 60 + m!;
    if (slotMins >= target) return s;
  }
  return slots[slots.length - 1] ?? "09:30";
}

/** Next 30-minute slot at least `bufferMinutes` ahead — for “smart” default */
export function nextRoundedSlot(bufferMinutes = 90): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + bufferMinutes, 0, 0);
  const mins = d.getMinutes();
  if (mins > 0 && mins <= 30) d.setMinutes(30, 0, 0);
  else if (mins > 30) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  }
  const h = String(d.getHours()).padStart(2, "0");
  const m = d.getMinutes() === 30 ? "30" : "00";
  return `${h}:${m}`;
}
