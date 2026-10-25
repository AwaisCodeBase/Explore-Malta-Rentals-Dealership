/**
 * Opens the Explore Malta Rentals Google Maps reviews panel.
 * Set GOOGLE_REVIEW_URL to the Business Profile "Get more reviews" link
 * (https://search.google.com/local/writereview?placeid=... or https://g.page/r/.../review)
 * when that official composer link is available.
 */
export const DEFAULT_GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Explore+Malta+Rentals/@35.8930132,14.4967482,17z/data=!4m8!3m7!1s0x130e5b980a72a821:0x4d9e8f6a230b051d!8m2!3d35.8930132!4d14.4967482!9m1!1b1!16s%2Fg%2F11z48crtyp";

export type GoogleReviewUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

export function resolveGoogleReviewUrl(envValue = process.env.GOOGLE_REVIEW_URL): GoogleReviewUrlResult {
  const configured = envValue?.trim() ?? "";
  if (!configured) {
    return { ok: true, url: DEFAULT_GOOGLE_REVIEW_URL };
  }

  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:") {
      return { ok: false, reason: "GOOGLE_REVIEW_URL must use https" };
    }
    return { ok: true, url: configured };
  } catch {
    return { ok: false, reason: "GOOGLE_REVIEW_URL is not a valid URL" };
  }
}
