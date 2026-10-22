export const BRAND_TITLE = "Explore Malta Rentals";
export const BRAND_TITLE_PREFIX = "Explore ";
export const BRAND_TITLE_MALTA = "Malta ";
export const BRAND_TITLE_SCRIPT = "Rentals";
export const INSTANT_CLIP_ID = "landing-preloader-instant-clip";
export const SVG_WIDTH = 760;
export const SVG_HEIGHT = 128;
export const TEXT_Y = 76;
export const MIN_DURATION_S = 3;
export const MAX_DURATION_S = 4.5;

/** Abstract route line — subtle journey cue, not a map. */
export const ROUTE_PATH =
  "M -20 420 C 180 340, 320 480, 520 400 S 820 360, 980 440";

/** Handwritten swoosh inspired by the Rentals script mark. */
export const RENTALS_SWOOSH_PATH =
  "M 552 98 C 580 108, 604 90, 628 98 S 652 104, 670 95";

/** Angular star fragment — abstract brand accent, not the logo mark. */
export const ACCENT_SHARD_PATH = "M 0 0 L 14 38 L 3 42 Z";

export function buildWavePath(
  width: number,
  height: number,
  fillRatio: number,
  phase: number,
): string {
  const surfaceY = height * (1 - fillRatio);
  const amplitude = Math.min(10, height * 0.045);
  const steps = Math.max(12, Math.ceil(width / 24));

  let path = `M 0 ${height} L 0 ${surfaceY}`;

  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * width;
    const y =
      surfaceY + Math.sin((x / width) * Math.PI * 4 + phase) * amplitude;
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  path += ` L ${width} ${height} Z`;
  return path;
}

export const INITIAL_WAVE_PATH = buildWavePath(SVG_WIDTH, SVG_HEIGHT, 0, 0);
