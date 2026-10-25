import {
  ACCENT_SHARD_PATH,
  BRAND_TITLE,
  BRAND_TITLE_MALTA,
  BRAND_TITLE_PREFIX,
  BRAND_TITLE_SCRIPT,
  RENTALS_SWOOSH_PATH,
  ROUTE_PATH,
  SVG_HEIGHT,
  SVG_WIDTH,
  TEXT_Y,
} from "@/features/home/lib/landing-preloader-shared";
import type { RefObject } from "react";

type LandingPreloaderFrameProps = Readonly<{
  clipId: string;
  wavePath: string;
  percent?: string;
  instant?: boolean;
  animated?: boolean;
  exiting?: boolean;
  rootRef?: RefObject<HTMLDivElement | null>;
  waveRef?: RefObject<SVGPathElement | null>;
  percentRef?: RefObject<HTMLSpanElement | null>;
  centerRef?: RefObject<HTMLDivElement | null>;
  footerRef?: RefObject<HTMLDivElement | null>;
  routeRef?: RefObject<SVGPathElement | null>;
  swooshRef?: RefObject<SVGPathElement | null>;
  accentRef?: RefObject<SVGSVGElement | null>;
}>;

export function LandingPreloaderFrame({
  clipId,
  wavePath,
  percent = "0",
  instant = false,
  animated = false,
  exiting = false,
  rootRef,
  waveRef,
  percentRef,
  centerRef,
  footerRef,
  routeRef,
  swooshRef,
  accentRef,
}: LandingPreloaderFrameProps) {
  return (
    <div
      ref={rootRef}
      className={[
        "landing-preloader",
        instant ? "landing-preloader--instant" : null,
        animated ? "landing-preloader--animated" : null,
        exiting ? "landing-preloader--exiting" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      role={instant ? "presentation" : "status"}
      aria-live={instant ? undefined : "polite"}
      aria-label={instant ? undefined : `Loading ${BRAND_TITLE}`}
      aria-hidden={instant ? true : undefined}
    >
      <div className="landing-preloader__backdrop" aria-hidden="true">
        <div className="landing-preloader__glow" />
        <div className="landing-preloader__glow landing-preloader__glow--secondary" />
        <svg
          className="landing-preloader__route"
          viewBox="0 0 960 540"
          preserveAspectRatio="xMidYMid slice"
        >
          <path ref={routeRef} d={ROUTE_PATH} className="landing-preloader__route-line" />
        </svg>
        <svg
          ref={accentRef}
          className="landing-preloader__accent"
          viewBox="0 0 14 42"
          aria-hidden="true"
        >
          <path d={ACCENT_SHARD_PATH} className="landing-preloader__accent-shard" />
        </svg>
      </div>

      <div ref={centerRef} className="landing-preloader__center">
        <div className="landing-preloader__brand">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="landing-preloader__title-svg"
            role="img"
            aria-label={BRAND_TITLE}
          >
            <defs>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <path ref={waveRef} d={wavePath} />
              </clipPath>
            </defs>

            <text
              x={SVG_WIDTH / 2}
              y={TEXT_Y}
              textAnchor="middle"
              className="landing-preloader__title-base"
            >
              <tspan>{BRAND_TITLE_PREFIX}</tspan>
              <tspan className="landing-preloader__title-malta">{BRAND_TITLE_MALTA}</tspan>
              <tspan className="landing-preloader__title-script">{BRAND_TITLE_SCRIPT}</tspan>
            </text>

            <text
              x={SVG_WIDTH / 2}
              y={TEXT_Y}
              textAnchor="middle"
              className="landing-preloader__title-fill"
              clipPath={`url(#${clipId})`}
            >
              <tspan>{BRAND_TITLE_PREFIX}</tspan>
              <tspan className="landing-preloader__title-malta">{BRAND_TITLE_MALTA}</tspan>
              <tspan className="landing-preloader__title-script">{BRAND_TITLE_SCRIPT}</tspan>
            </text>

            <g className="landing-preloader__swoosh-wrap">
              <path
                ref={swooshRef}
                d={RENTALS_SWOOSH_PATH}
                className="landing-preloader__swoosh"
              />
            </g>
          </svg>
        </div>
      </div>

      <div ref={footerRef} className="landing-preloader__footer">
        <p className="landing-preloader__status">
          <span ref={percentRef} className="landing-preloader__percent-value">
            {percent}
          </span>
          <span className="landing-preloader__percent-symbol" aria-hidden="true">
            %
          </span>
        </p>
      </div>
    </div>
  );
}
