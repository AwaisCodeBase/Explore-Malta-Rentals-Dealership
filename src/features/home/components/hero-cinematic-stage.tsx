"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { Pause, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";

const HERO_VIDEO_SRC = "/hero.mp4";
const VIDEO_BACKGROUND_SRC = "/video-background.png";

type HeroCinematicContextValue = {
  videoOpen: boolean;
  openVideo: () => void;
  closeVideo: () => void;
};

const HeroCinematicContext = createContext<HeroCinematicContextValue | null>(null);

function useHeroCinematic() {
  const ctx = useContext(HeroCinematicContext);
  if (!ctx) {
    throw new Error("HeroVideoTrigger must be used within HeroCinematicStage");
  }
  return ctx;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="currentColor">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function HeroVideoTrigger() {
  const t = useTranslations("Home");
  const { videoOpen, openVideo, closeVideo } = useHeroCinematic();

  return (
    <button
      type="button"
      onClick={videoOpen ? closeVideo : openVideo}
      aria-expanded={videoOpen}
      className={`hero-watch-video ${videoOpen ? "hero-watch-video--active" : ""}`}
    >
      <span className="hero-watch-video__icon" aria-hidden="true">
        <PlayIcon />
      </span>
      <span className="hero-watch-video__label">{t("heroWatchVideo")}</span>
    </button>
  );
}

type HeroCinematicStageProps = Readonly<{
  heroBackgroundSrc: string;
  heroBackgroundSrcMobile: string;
  children: ReactNode;
}>;

export function HeroCinematicStage({
  heroBackgroundSrc,
  heroBackgroundSrcMobile,
  children,
}: HeroCinematicStageProps) {
  const tNav = useTranslations("Nav");
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoOpen) {
      const id = requestAnimationFrame(() => setVideoVisible(true));
      return () => cancelAnimationFrame(id);
    }

    setVideoVisible(false);
  }, [videoOpen]);

  useEffect(() => {
    if (!videoVisible) return;

    const video = videoRef.current;
    void video?.play().catch(() => {});
    setIsPlaying(true);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoOpen(false);
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [videoVisible]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  }

  const contextValue: HeroCinematicContextValue = {
    videoOpen,
    openVideo: () => setVideoOpen(true),
    closeVideo: () => setVideoOpen(false),
  };

  return (
    <HeroCinematicContext.Provider value={contextValue}>
      <section
        aria-labelledby="home-hero-title"
        data-video-open={videoOpen ? "true" : "false"}
        className="hero-cinematic relative isolate -mt-[var(--site-header-offset)] w-full overflow-hidden bg-black text-white"
        style={{
          height: "calc(100svh + var(--site-header-offset))",
          minHeight: "calc(100svh + var(--site-header-offset))",
        }}
      >
        <div
          className="hero-cinematic__background absolute inset-0 transition-opacity duration-700 ease-out"
          aria-hidden="true"
          style={{ opacity: videoOpen ? 0 : 1 }}
        >
          <Image
            src={heroBackgroundSrcMobile}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="hero-cinematic__background-image hero-cinematic__background-image--mobile object-cover md:hidden"
          />
          <Image
            src={heroBackgroundSrc}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="hero-cinematic__background-image hero-cinematic__background-image--desktop hidden object-cover md:block"
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-950/85 via-slate-950/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t from-slate-950/70 to-transparent" />
        </div>

        <div
          className="hero-cinematic__video-background absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out"
          aria-hidden={!videoOpen}
          style={{ opacity: videoOpen ? 1 : 0, pointerEvents: videoOpen ? "auto" : "none" }}
        >
          <div className="hero-cinematic__video-scene">
            <Image
              src={VIDEO_BACKGROUND_SRC}
              alt=""
              fill
              unoptimized
              sizes="100vw"
              className="hero-cinematic__video-background-image object-cover"
            />

            <div
              className={`hero-video-screen ${videoVisible ? "hero-video-screen--visible" : ""}`}
            >
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                aria-label={tNav("close")}
                className="hero-video-screen__close"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>

              {videoOpen ? (
                <>
                  <div className="hero-video-screen__viewport">
                    <video
                      ref={videoRef}
                      src={HERO_VIDEO_SRC}
                      playsInline
                      preload="metadata"
                      className="hero-video-screen__video"
                      onClick={togglePlayback}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  </div>

                  <div className="hero-video-screen__controls">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                      className="hero-video-screen__play"
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5" strokeWidth={2.25} />
                      ) : (
                        <Play className="h-3.5 w-3.5" strokeWidth={2.25} />
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-slate-950/75 via-slate-950/15 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>

        <div className="relative z-10 flex h-full flex-col pt-[calc(var(--site-header-offset)+var(--site-hero-content-inset))]">
          {children}
        </div>
      </section>
    </HeroCinematicContext.Provider>
  );
}
