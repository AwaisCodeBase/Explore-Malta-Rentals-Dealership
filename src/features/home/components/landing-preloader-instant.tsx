import { LandingPreloaderFrame } from "@/features/home/components/landing-preloader-frame";
import {
  INITIAL_WAVE_PATH,
  INSTANT_CLIP_ID,
} from "@/features/home/lib/landing-preloader-shared";

export function LandingPreloaderInstant() {
  return (
    <LandingPreloaderFrame
      clipId={INSTANT_CLIP_ID}
      wavePath={INITIAL_WAVE_PATH}
      instant
    />
  );
}
