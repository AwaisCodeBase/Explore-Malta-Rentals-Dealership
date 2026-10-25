"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import type { servicesHeadlineIcons } from "@/features/home/data/home-sections";

import { SERVICE_ICON_SRC } from "@/features/home/components/services/service-headline-icon";

type ServiceHeadlineIconId = (typeof servicesHeadlineIcons)[number];

type DockItem = Readonly<{
  id: ServiceHeadlineIconId;
  label: string;
}>;

type ServiceHeadlineIconDockProps = Readonly<{
  items: readonly DockItem[];
  ariaLabel: string;
}>;

const MAX_SCALE = 1.52;
const MIN_SCALE = 1;
const MAX_VIRTUAL_DISTANCE = 2.15;
const MAX_LIFT_PX = 20;
const DOCK_TRANSITION = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";

function scaleFromVirtualDistance(distance: number): number {
  if (distance >= MAX_VIRTUAL_DISTANCE) return MIN_SCALE;

  const t = 1 - distance / MAX_VIRTUAL_DISTANCE;
  const eased = (1 - Math.cos(t * Math.PI)) / 2;
  return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * eased;
}

function computeLift(scale: number): number {
  if (scale <= MIN_SCALE) return 0;
  return ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * MAX_LIFT_PX;
}

function scalesForVirtualIndex(count: number, virtualIndex: number): number[] {
  return Array.from({ length: count }, (_, index) =>
    scaleFromVirtualDistance(Math.abs(index - virtualIndex)),
  );
}

export function ServiceHeadlineIconDock({ items, ariaLabel }: ServiceHeadlineIconDockProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [scales, setScales] = useState<number[]>(() => items.map(() => MIN_SCALE));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resetDock = useCallback(() => {
    setScales(items.map(() => MIN_SCALE));
    setActiveIndex(null);
    setIsHovering(false);
  }, [items]);

  const updateDock = useCallback(
    (pointerX: number) => {
      if (reduceMotion || items.length === 0) return;

      const list = listRef.current;
      if (!list) return;

      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (pointerX - rect.left) / rect.width));
      const virtualIndex = progress * (items.length - 1);
      const nextScales = scalesForVirtualIndex(items.length, virtualIndex);

      setScales(nextScales);
      setActiveIndex(
        nextScales.reduce(
          (bestIndex, scale, index, all) => (scale > all[bestIndex] ? index : bestIndex),
          0,
        ),
      );
      setIsHovering(true);
    },
    [items.length, reduceMotion],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLUListElement>) => {
      updateDock(event.clientX);
    },
    [updateDock],
  );

  const handleMouseLeave = useCallback(() => {
    resetDock();
  }, [resetDock]);

  const handleFocus = useCallback(
    (index: number) => {
      if (reduceMotion) return;

      setScales(scalesForVirtualIndex(items.length, index));
      setActiveIndex(index);
      setIsHovering(true);
    },
    [items.length, reduceMotion],
  );

  const dockItems = useMemo(
    () =>
      items.map((item, index) => {
        const scale = scales[index] ?? MIN_SCALE;
        const lift = computeLift(scale);

        return (
          <li key={item.id} className="relative flex shrink-0 flex-col items-center">
            <button
              type="button"
              aria-label={item.label}
              className="group relative block origin-bottom cursor-default border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E5E5E5]"
              style={{
                transform: `translate3d(0, ${-lift}px, 0) scale(${scale})`,
                transition: reduceMotion ? undefined : DOCK_TRANSITION,
                willChange: isHovering ? "transform" : undefined,
              }}
              onFocus={() => handleFocus(index)}
              onBlur={resetDock}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local PNG benefit icons */}
              <img
                src={SERVICE_ICON_SRC[item.id]}
                alt=""
                aria-hidden
                draggable={false}
                width={80}
                height={80}
                className="pointer-events-none h-[3.25rem] w-[3.25rem] object-contain sm:h-[4.75rem] sm:w-[4.75rem] lg:h-20 lg:w-20"
              />
            </button>

            {activeIndex === index && isHovering ? (
              <span
                role="tooltip"
                className="pointer-events-none absolute top-full z-20 mt-3 w-max max-w-[12rem] text-center whitespace-normal rounded-full bg-[#DCDCDC] px-3 py-1.5 text-xs font-medium leading-snug tracking-[-0.01em] text-slate-800 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.28)] sm:max-w-none sm:whitespace-nowrap"
                style={{
                  left: "50%",
                  transform: `translateX(-50%) translateY(${-lift * 0.35}px)`,
                  transition: reduceMotion ? undefined : DOCK_TRANSITION,
                }}
              >
                {item.label}
              </span>
            ) : null}
          </li>
        );
      }),
    [activeIndex, handleFocus, isHovering, items, reduceMotion, resetDock, scales],
  );

  return (
    <ul
      ref={listRef}
      aria-label={ariaLabel}
      className="my-7 flex w-full list-none items-end justify-between gap-1 p-0 pt-8 sm:my-8 lg:my-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {dockItems}
    </ul>
  );
}
