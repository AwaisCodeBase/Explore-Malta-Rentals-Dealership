"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useId, useRef, useState } from "react";
import { LandingPreloaderFrame } from "@/features/home/components/landing-preloader-frame";
import {
  buildWavePath,
  INITIAL_WAVE_PATH,
  MAX_DURATION_S,
  MIN_DURATION_S,
  SVG_HEIGHT,
  SVG_WIDTH,
} from "@/features/home/lib/landing-preloader-shared";

type LandingPreloaderProps = Readonly<{
  onReveal: () => void;
  onDismiss: () => void;
}>;

function waitForPageReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (document.readyState === "complete") return Promise.resolve();

  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

export function LandingPreloader({ onReveal, onDismiss }: LandingPreloaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGPathElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const swooshRef = useRef<SVGPathElement>(null);
  const accentRef = useRef<SVGSVGElement>(null);
  const [exiting, setExiting] = useState(false);
  const clipId = useId().replace(/:/g, "");

  useGSAP(
    () => {
      const overlay = overlayRef.current;
      const wave = waveRef.current;
      const percentNode = percentRef.current;
      const centerNode = centerRef.current;
      const footerNode = footerRef.current;
      const routeNode = routeRef.current;
      const swooshNode = swooshRef.current;
      const accentNode = accentRef.current;

      if (
        overlay == null ||
        wave == null ||
        percentNode == null ||
        centerNode == null ||
        footerNode == null
      ) {
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        onReveal();
        onDismiss();
        return;
      }

      const progress = { value: 0, phase: 0 };

      const updateProgress = () => {
        const fillRatio = progress.value / 100;
        wave.setAttribute(
          "d",
          buildWavePath(SVG_WIDTH, SVG_HEIGHT, fillRatio, progress.phase),
        );
        percentNode.textContent = `${Math.round(progress.value)}`;
      };

      wave.setAttribute("d", INITIAL_WAVE_PATH);
      updateProgress();

      const routeLength = routeNode?.getTotalLength() ?? 0;
      const swooshLength = swooshNode?.getTotalLength() ?? 0;

      if (routeNode && routeLength > 0) {
        routeNode.style.strokeDasharray = `${routeLength}`;
        routeNode.style.strokeDashoffset = `${routeLength}`;
      }

      if (swooshNode && swooshLength > 0) {
        swooshNode.style.strokeDasharray = `${swooshLength}`;
        swooshNode.style.strokeDashoffset = `${swooshLength}`;
      }

      gsap.set([centerNode, footerNode], { autoAlpha: 0, y: 18 });
      if (accentNode) {
        gsap.set(accentNode, { autoAlpha: 0, scale: 0.88, transformOrigin: "50% 50%" });
      }

      const entrance = gsap.timeline({ delay: 0.08 });
      entrance.to(centerNode, {
        autoAlpha: 1,
        y: 0,
        duration: 0.95,
        ease: "power3.out",
      });
      entrance.to(
        footerNode,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
        },
        0.22,
      );

      if (accentNode) {
        entrance.to(
          accentNode,
          {
            autoAlpha: 0.72,
            scale: 1,
            duration: 0.7,
            ease: "power2.out",
          },
          0.18,
        );
      }

      if (routeNode && routeLength > 0) {
        entrance.to(
          routeNode,
          {
            strokeDashoffset: 0,
            duration: 2.4,
            ease: "power1.inOut",
          },
          0.12,
        );
      }

      if (swooshNode && swooshLength > 0) {
        entrance.to(
          swooshNode,
          {
            strokeDashoffset: 0,
            duration: 1.15,
            ease: "power2.inOut",
          },
          0.42,
        );
      }

      const phaseTween = gsap.to(progress, {
        phase: Math.PI * 2,
        duration: 2.4,
        repeat: -1,
        ease: "none",
        onUpdate: updateProgress,
      });

      const counter = gsap.to(progress, {
        value: 92,
        duration: MIN_DURATION_S,
        ease: "power2.inOut",
        onUpdate: updateProgress,
      });

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        phaseTween.kill();
        counter.kill();

        gsap.to(progress, {
          value: 100,
          duration: 0.55,
          ease: "power2.out",
          onUpdate: updateProgress,
          onComplete: () => {
            onReveal();
            setExiting(true);
            gsap.to(overlay, {
              autoAlpha: 0,
              y: -28,
              duration: 0.85,
              ease: "power2.inOut",
              onComplete: onDismiss,
            });
          },
        });
      };

      const start = performance.now();
      void waitForPageReady().then(() => {
        const elapsed = (performance.now() - start) / 1000;
        const remaining = Math.max(0, MIN_DURATION_S - elapsed);
        gsap.delayedCall(remaining, () => {
          counter.kill();
          finish();
        });
      });

      gsap.delayedCall(MAX_DURATION_S, () => {
        counter.kill();
        finish();
      });

      return () => {
        entrance.kill();
        phaseTween.kill();
        counter.kill();
      };
    },
    { dependencies: [clipId, onDismiss, onReveal] },
  );

  return (
    <LandingPreloaderFrame
      rootRef={overlayRef}
      animated
      exiting={exiting}
      clipId={clipId}
      wavePath={INITIAL_WAVE_PATH}
      waveRef={waveRef}
      percentRef={percentRef}
      centerRef={centerRef}
      footerRef={footerRef}
      routeRef={routeRef}
      swooshRef={swooshRef}
      accentRef={accentRef}
    />
  );
}
