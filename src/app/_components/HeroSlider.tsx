"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { HERO_SLIDES } from "@/lib/hero-slides";
import { REGION_LABELS } from "@/types/region";

const SLIDE_COUNT = HERO_SLIDES.length;
const AUTO_INTERVAL_MS = 4500;
const TICK_MS = 50;
const SIDE_OFFSET_PX = 700;
const FAR_OFFSET_PX = SIDE_OFFSET_PX + 420;
const SWIPE_THRESHOLD_PX = 40;
const STAGE_TRANSITION =
  "transform 760ms cubic-bezier(0.36,0.07,0.19,0.97), filter 760ms ease, opacity 760ms ease";

type Relation = -2 | -1 | 0 | 1 | 2;

function relationOf(slideIndex: number, currentIndex: number): Relation {
  const d = (slideIndex - currentIndex + SLIDE_COUNT) % SLIDE_COUNT;
  if (d === 0) return 0;
  if (d === 1) return 1;
  if (d === SLIDE_COUNT - 1) return -1;
  return d <= 3 ? 2 : -2;
}

// 진행 바 채움은 state로 돌리지 않는다 — 50ms 틱마다 리렌더하면 히어로
// 전체가 다시 그려진다. ref에 직접 scaleX를 써서 렌더 사이클 밖에서 처리한다.
function paintFills(
  fillRefs: Array<HTMLSpanElement | null>,
  current: number,
  progress: number,
) {
  fillRefs.forEach((el, n) => {
    if (!el) return;
    const value = n < current ? 1 : n > current ? 0 : progress;
    el.style.transform = `scaleX(${value.toFixed(3)})`;
  });
}

function slideStyle(
  relation: Relation,
  reducedMotion: boolean,
  hideSides: boolean,
): CSSProperties {
  if (reducedMotion) {
    return {
      transition: "opacity 400ms ease",
      transform: "translateX(-50%)",
      filter: "none",
      opacity: relation === 0 ? 1 : 0,
      zIndex: relation === 0 ? 3 : 1,
    };
  }

  if (relation === 0) {
    return {
      transition: STAGE_TRANSITION,
      transform: "translateX(-50%)",
      filter: "none",
      opacity: 1,
      zIndex: 3,
    };
  }

  // < 768px: 좌우 흐린 사진을 숨기고 가운데 한 장만 보인다.
  if (hideSides) {
    return {
      transition: STAGE_TRANSITION,
      transform: "translateX(-50%)",
      filter: "none",
      opacity: 0,
      zIndex: 1,
    };
  }

  if (relation === 1 || relation === -1) {
    const sign = relation === 1 ? "+" : "-";
    return {
      transition: STAGE_TRANSITION,
      transform: `translateX(calc(-50% ${sign} ${SIDE_OFFSET_PX}px)) scale(0.86)`,
      filter: "blur(5px) brightness(0.82)",
      opacity: 0.9,
      zIndex: 2,
    };
  }

  const sign = relation === 2 ? "+" : "-";
  return {
    transition: STAGE_TRANSITION,
    transform: `translateX(calc(-50% ${sign} ${FAR_OFFSET_PX}px)) scale(0.72)`,
    filter: "blur(8px) brightness(0.8)",
    opacity: 0,
    zIndex: 1,
  };
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hideSides, setHideSides] = useState(false);

  const progressRef = useRef(0);
  const fillRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef(true);
  const touchStartXRef = useRef<number | null>(null);

  function goTo(next: number) {
    progressRef.current = 0;
    setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setHideSides(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setHideSides(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    paintFills(fillRefs.current, index, progressRef.current);
  }, [index]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => {
      if (document.hidden || !visibleRef.current) return;
      progressRef.current += TICK_MS / AUTO_INTERVAL_MS;
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        setIndex((current) => (current + 1) % SLIDE_COUNT);
      } else {
        paintFills(fillRefs.current, index, progressRef.current);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, index]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    goTo(delta > 0 ? index - 1 : index + 1);
  }

  return (
    <div>
      <div
        ref={stageRef}
        className="relative mt-8 h-[calc(min(1020px,92vw)*0.55)] sm:mt-13"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {HERO_SLIDES.map((slide, n) => {
          const relation = relationOf(n, index);
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: 6장 고정, 순서 불변
              key={n}
              aria-hidden={relation !== 0}
              className="absolute top-0 left-1/2 aspect-[20/11] w-[min(1020px,92vw)] overflow-hidden rounded-[26px] bg-[oklch(0.9_0.01_30)] shadow-[0_30px_70px_oklch(0.4_0.03_30_/_0.18)]"
              style={slideStyle(relation, reducedMotion, hideSides)}
            >
              {slide.image ? (
                <Image
                  src={slide.image}
                  alt={slide.place || `${REGION_LABELS[slide.region]} 사진`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1100px) 92vw, 1020px"
                  priority={n === 0}
                  fetchPriority={n === 0 ? "high" : undefined}
                  loading={n === 0 ? undefined : "lazy"}
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-[oklch(0.14_0.02_32_/_0.72)] to-transparent" />
              <div className="absolute bottom-6 left-6.5 flex items-center gap-2.5 text-white">
                <span className="rounded-full bg-[oklch(0.5_0.19_28)] px-2.75 py-1.25 text-xs font-extrabold tracking-[0.12em]">
                  {REGION_LABELS[slide.region]}
                </span>
                {slide.place ? (
                  <span className="text-sm font-bold">{slide.place}</span>
                ) : null}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          aria-label="이전 사진"
          onClick={() => goTo(index - 1)}
          className="absolute inset-y-0 left-0 hidden w-[calc(50%-510px)] cursor-pointer border-0 bg-transparent md:block"
        />
        <button
          type="button"
          aria-label="다음 사진"
          onClick={() => goTo(index + 1)}
          className="absolute inset-y-0 right-0 hidden w-[calc(50%-510px)] cursor-pointer border-0 bg-transparent md:block"
        />
      </div>

      <div className="mx-auto flex max-w-[1020px] items-center gap-4.5 px-6 pb-10 sm:px-10 sm:pb-14">
        <div className="flex items-center gap-2">
          <ControlButton label="이전 사진" onClick={() => goTo(index - 1)}>
            <PrevIcon />
          </ControlButton>
          <ControlButton
            label={paused ? "자동 전환 재생" : "자동 전환 일시정지"}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </ControlButton>
          <ControlButton label="다음 사진" onClick={() => goTo(index + 1)}>
            <NextIcon />
          </ControlButton>
        </div>

        <div className="flex flex-1 items-center gap-2.5">
          {HERO_SLIDES.map((_, n) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: 6장 고정, 순서 불변
              key={n}
              type="button"
              aria-label={`${n + 1}번 사진`}
              onClick={() => goTo(n)}
              className="flex-1 cursor-pointer border-0 bg-transparent p-0"
            >
              <span className="block h-[3px] overflow-hidden rounded-full bg-[oklch(0.9_0.012_30)]">
                <span
                  ref={(el) => {
                    fillRefs.current[n] = el;
                  }}
                  className="block h-full origin-left rounded-full bg-primary"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[13px] font-extrabold tracking-[0.06em] text-[oklch(0.35_0.014_30)]">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="text-[oklch(0.55_0.014_30)]">
            / {String(SLIDE_COUNT).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 cursor-pointer place-items-center rounded-full border border-[oklch(0.9_0.012_30)] bg-white text-[oklch(0.35_0.014_30)] transition-colors hover:bg-[oklch(0.96_0.01_30)] md:size-[34px]"
    >
      {children}
    </button>
  );
}

function PrevIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17 4v16L6 12z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 4v16l11-8z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 4l13 8-13 8z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
