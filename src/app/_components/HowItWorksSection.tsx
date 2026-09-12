"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Icon, type IconName } from "@/components/ui/icon";

// HOW? 섹션: 일정을 만드는 4단계를 좌우로 전환되는 캐러셀로 보여준다. 1~3단계는
// JOURNEY_STEPS와 같은 문구를 쓰지만, 4번째("AI 일정 결과")는 새 단계가 아니라
// 3단계("AI 일정 생성")의 완료 상태라 JOURNEY_STEPS에는 없다 — 이 섹션 전용
// 데이터다. (JOURNEY_STEPS는 대시보드 ProgressStepper·생성 흐름이 계속
// 참조하므로 건드리지 않는다.) 자세한 배경은 docs/plan/home-how-section-carousel.md.
const HOW_STEPS: {
  label: string;
  desc: string;
  hint: string;
  image: string;
}[] = [
  {
    label: "여행 조건",
    desc: "가고 싶은 지역과 출발일, 기간을 고릅니다.",
    hint: "경상도 소도시 3곳 · 당일 ~ 2박 3일",
    image: "/how/step-1.webp",
  },
  {
    label: "콘텐츠 담기",
    desc: "마음에 드는 장소를 바구니에 담고 우선순위를 정합니다.",
    hint: "두 곳만 담아도 생성 가능",
    image: "/how/step-2.webp",
  },
  {
    label: "AI 일정 생성",
    desc: "이동 거리와 운영 시간을 고려한 일정이 만들어집니다.",
    hint: "평균 30초",
    image: "/how/step-3.webp",
  },
  {
    label: "AI 일정 결과",
    desc: "하루 단위 순서와 배치 이유를 지도와 함께 확인하고, 빼고 다시 만들 수 있습니다.",
    hint: "일정 저장 · 공유",
    image: "/how/step-4.webp",
  },
];

// 원래 CRITERIA의 제목·아이콘만 헤더 아래 얇은 칩으로 재배치한다(원본 지시서
// 6번: "문구를 살려 헤더 아래나 슬라이드 보조 라벨로 재배치" — 시안 자체에는
// 이 3줄이 없어서 생긴 보정, docs/plan/home-how-section-carousel.md 참고).
const CRITERIA: { icon: IconName; title: string }[] = [
  { icon: "pin", title: "이동 거리" },
  { icon: "calendar", title: "운영 시간" },
  { icon: "restaurant-outline", title: "식사 시간" },
];

const INTERVAL_MS = 3000;
const COUNT = HOW_STEPS.length;

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

// 오른쪽 텍스트 열(흰 배경) 위에 놓이는 캐러셀 컨트롤. 캡쳐 위 오버레이가
// 아니라 drop-shadow 없이 테두리로 형태를 잡는다.
const CONTROL_CLASS =
  "relative grid h-7 w-7 place-items-center rounded-full border border-border text-[oklch(0.45_0.02_30)] transition-colors hover:bg-accent hover:text-[oklch(0.24_0.02_30)] focus-visible:bg-accent focus-visible:text-[oklch(0.24_0.02_30)] before:absolute before:-inset-2 before:content-['']";

export function HowItWorksSection() {
  const [index, setIndex] = useState(0);
  // 진행 바를 매 전환마다 처음부터 다시 재생시키는 remount 키.
  const [tick, setTick] = useState(0);
  // 수동 조작 시 자동 타이머를 리셋하는 키.
  const [restartKey, setRestartKey] = useState(0);
  const [hover, setHover] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // setInterval 콜백이 최신 hover/stopped 값을 읽되, 값이 바뀔 때마다 타이머를
  // 리셋해 남은 시간이 초기화되지 않도록 ref로 넘긴다.
  const pausedRef = useRef({ hover, stopped });
  pausedRef.current = { hover, stopped };

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const go = useCallback((next: number) => {
    setIndex((next + COUNT) % COUNT);
    setTick((value) => value + 1);
    setRestartKey((value) => value + 1);
  }, []);

  const toggleAuto = useCallback(() => {
    setStopped((value) => !value);
    setTick((value) => value + 1);
    setRestartKey((value) => value + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: restartKey는 값을 읽지 않고 자동 타이머를 리셋하는 트리거로만 쓴다
  useEffect(() => {
    if (reducedMotion || stopped) return;
    const timer = setInterval(() => {
      if (pausedRef.current.hover || pausedRef.current.stopped) return;
      if (typeof document !== "undefined" && document.hidden) return;
      setIndex((value) => (value + 1) % COUNT);
      setTick((value) => value + 1);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion, stopped, restartKey]);

  // 백그라운드 탭으로 갔다가 돌아올 때 진행 바를 처음부터 다시 그린다.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) setTick((value) => value + 1);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  const autoPaused = hover || stopped || reducedMotion;

  return (
    <section className="border-y border-[oklch(0.94_0.02_30)] bg-[oklch(0.98_0.014_32)]">
      <div className="mx-auto max-w-7xl px-10 pt-21 pb-24">
        <div>
          <p className="text-[13px] font-extrabold tracking-[0.14em] text-primary">
            HOW?
          </p>
          <h2 className="mt-3 text-[40px] leading-[1.18] font-extrabold tracking-[-0.05em]">
            네 화면이면
            <br />
            일정이 끝납니다
          </h2>
          <ul className="mt-5 flex flex-wrap items-center gap-2">
            {CRITERIA.map((row) => (
              <li
                key={row.title}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                <Icon name={row.icon} size={13} className="text-primary" />
                {row.title}
              </li>
            ))}
          </ul>
        </div>

        <section
          aria-roledescription="carousel"
          aria-label="일정 만드는 4단계"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          // 키보드/스크린리더로 '이전 단계'나 step 버튼에 포커스가 들어와
          // 있는 동안에도 자동 전환을 멈춘다(WAI-ARIA 캐러셀 패턴의 focus
          // 시 pause 요구사항). onFocus/onBlur는 버블링하므로 하위 버튼의
          // 포커스 변화도 이 섹션에서 잡힌다 — focus-within과 동일한 효과.
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          onKeyDown={onKeyDown}
          className="mt-9 overflow-hidden rounded-[32px] border border-border bg-white shadow-[0_2px_6px_oklch(0.4_0.03_30_/_0.04),0_28px_60px_oklch(0.4_0.03_30_/_0.09)]"
        >
          <div className="overflow-hidden">
            <div
              data-testid="how-carousel-track"
              className="flex transition-transform duration-[680ms] ease-[cubic-bezier(.36,.07,.19,.97)] motion-reduce:transition-none"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {HOW_STEPS.map((step, i) => {
                const active = i === index;
                return (
                  <div
                    key={step.label}
                    aria-hidden={!active}
                    className="grid min-w-full flex-[0_0_100%] items-center gap-7.5 p-6.5 lg:grid-cols-[1.5fr_0.75fr]"
                  >
                    <div className="overflow-hidden rounded-[22px] border border-border bg-[oklch(0.975_0.012_30)]">
                      <div className="flex h-8 items-center gap-1.5 border-b border-border px-3">
                        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="relative aspect-[16/10] lg:aspect-auto lg:h-[460px]">
                        <Image
                          src={step.image}
                          alt={`${step.label} 화면`}
                          fill
                          // 화면 캡쳐라 작은 UI 글자가 많다. next/image의 기본
                          // 손실 재인코딩(q75)을 거치면 텍스트가 뭉개져, 원본
                          // PNG를 그대로 내려 브라우저가 축소하게 둔다.
                          unoptimized
                          sizes="(min-width:1024px) 720px, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[56px] leading-none font-extrabold tracking-[-0.06em] text-[oklch(0.88_0.055_30)]">
                        {`0${i + 1}`}
                      </div>
                      <div className="mt-2 text-[11px] font-extrabold tracking-[0.1em] text-primary">
                        STEP {i + 1} / 04
                      </div>
                      <p className="mt-4 text-[28px] leading-[1.22] font-extrabold tracking-[-0.05em]">
                        {step.label}
                      </p>
                      <p className="mt-3.5 text-[15px] leading-[1.8] text-muted-foreground">
                        {step.desc}
                      </p>
                      <span className="mt-5 inline-block rounded-full bg-accent px-[13px] py-1.5 text-xs font-bold text-accent-foreground">
                        {step.hint}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 캐러셀 컨트롤(이전·정지/재생·다음): 진행 바 바로 위, 오른쪽 하단. */}
          <div className="flex justify-end gap-2 px-6.5 pt-4 pb-3">
            <button
              type="button"
              aria-label="이전 단계"
              onClick={() => go(index - 1)}
              className={CONTROL_CLASS}
            >
              <PrevIcon />
            </button>
            <button
              type="button"
              aria-label={stopped ? "자동 재생" : "자동 전환 정지"}
              onClick={toggleAuto}
              className={CONTROL_CLASS}
            >
              {stopped ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button
              type="button"
              aria-label="다음 단계"
              onClick={() => go(index + 1)}
              className={CONTROL_CLASS}
            >
              <NextIcon />
            </button>
          </div>

          <div className="flex items-center gap-3.5 px-6.5 pb-6">
            {HOW_STEPS.map((step, i) => {
              const fillStyle: CSSProperties =
                i < index
                  ? { transform: "scaleX(1)" }
                  : i > index
                    ? { transform: "scaleX(0)" }
                    : autoPaused && reducedMotion
                      ? { transform: "scaleX(1)" }
                      : {
                          transform: "scaleX(0)",
                          animation: `how-bar-fill ${INTERVAL_MS}ms linear forwards`,
                          animationPlayState: autoPaused ? "paused" : "running",
                        };
              return (
                <button
                  key={step.label}
                  type="button"
                  aria-label={`${step.label} 단계로 이동`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                  className="flex-1 cursor-pointer text-left"
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-[oklch(0.93_0.02_30)]">
                    <span
                      key={i === index ? `${index}-${tick}` : "static"}
                      className="block h-full origin-left rounded-full bg-primary"
                      style={fillStyle}
                    />
                  </span>
                  <span
                    className="mt-2.5 block text-xs font-bold transition-colors"
                    style={{
                      color:
                        i === index
                          ? "oklch(0.5 0.19 28)"
                          : "oklch(0.6 0.015 30)",
                    }}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
