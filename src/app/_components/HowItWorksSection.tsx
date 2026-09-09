"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { Icon, type IconName } from "@/components/ui/icon";

// HOW? 섹션: 4단계를 스크롤에 따라 겹쳐 쌓이는 카드로 보여준다. 1~3단계는
// JOURNEY_STEPS와 같은 문구를 쓰지만, 4번째("AI 일정 결과")는 새 단계가 아니라
// 3단계("AI 일정 생성")의 완료 상태라 JOURNEY_STEPS에는 없다 — 이 섹션 전용
// 데이터다. (JOURNEY_STEPS는 대시보드 ProgressStepper·생성 흐름이 계속
// 참조하므로 건드리지 않는다.)
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
    image: "/how/step-1.png",
  },
  {
    label: "콘텐츠 담기",
    desc: "마음에 드는 장소를 바구니에 담고 우선순위를 정합니다.",
    hint: "두 곳만 담아도 생성 가능",
    image: "/how/step-2.png",
  },
  {
    label: "AI 일정 생성",
    desc: "이동 거리와 운영 시간을 고려한 일정이 만들어집니다.",
    hint: "평균 30초",
    image: "/how/step-3.png",
  },
  {
    label: "AI 일정 결과",
    desc: "하루 단위 순서와 장소마다의 배치 이유를 지도와 함께 확인하고, 빼고 다시 만들 수 있습니다.",
    hint: "일정 저장 · 공유",
    image: "/how/step-4.png",
  },
];

// 원래 CRITERIA의 제목·아이콘만 헤더 아래 얇은 칩으로 재배치한다("AI가 무엇을
// 보고 순서를 정하는가"는 카드 4개의 서사와 별개로 남겨야 하는 문구라 — 시안
// 자체에는 이 3줄이 없어서 생긴 보정, docs/plan/home-how-section-stacked.md 참고).
const CRITERIA: { icon: IconName; title: string }[] = [
  { icon: "pin", title: "이동 거리" },
  { icon: "calendar", title: "운영 시간" },
  { icon: "restaurant-outline", title: "식사 시간" },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - (1 - t) ** 3;

export function HowItWorksSection() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const cards = cardRefs.current.filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (cards.length === 0) return;

    let cancelled = false;
    const stops: (() => void)[] = [];

    import("motion")
      .then(({ scroll }) => {
        if (cancelled) return;
        cards.forEach((el, i) => {
          // 등장: 아래에서 올라오며 페이드 인
          stops.push(
            scroll(
              (p: number) => {
                const t = ease(clamp(p));
                el.style.opacity = `${0.2 + 0.8 * t}`;
                el.style.transform = `translateY(${70 * (1 - t)}px)`;
              },
              { target: el, offset: ["start 0.95", "start 0.66"] },
            ),
          );
          // 다음 카드가 겹쳐 올라오는 동안 축소·페이드
          const next = cards[i + 1];
          if (next) {
            stops.push(
              scroll(
                (p: number) => {
                  const t = clamp(p);
                  el.style.transform = `scale(${1 - 0.06 * t})`;
                  el.style.opacity = `${1 - 0.35 * t}`;
                },
                { target: next, offset: ["start 0.8", "start 0.18"] },
              ),
            );
          }
        });
      })
      .catch((err) => {
        console.warn("motion 로드 실패 — 정적으로 표시합니다", err);
      });

    return () => {
      cancelled = true;
      for (const stop of stops) stop();
    };
  }, []);

  return (
    <section className="border-y border-[oklch(0.94_0.02_30)] bg-[oklch(0.98_0.014_32)]">
      <div className="mx-auto max-w-5xl px-10 pt-22 pb-37">
        <div className="text-center">
          <p className="text-[13px] font-extrabold tracking-[0.14em] text-primary">
            HOW?
          </p>
          <h2 className="mt-3 text-[40px] leading-[1.18] font-extrabold tracking-[-0.05em]">
            한 장씩 쌓이면
            <br />
            하루가 완성됩니다
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[15px] leading-relaxed text-muted-foreground">
            스크롤을 내리면 다음 단계 화면이 앞으로 겹쳐집니다.
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
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

        <div className="mt-14">
          {HOW_STEPS.map((step, index) => (
            <div
              key={step.label}
              className="pb-6.5 lg:sticky"
              style={{ top: `${96 + index * 16}px` }}
            >
              <div
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="grid origin-top grid-cols-1 items-center gap-6 rounded-[28px] border border-border bg-white p-5.5 shadow-[0_2px_6px_oklch(0.4_0.03_30_/_0.05),0_26px_56px_oklch(0.4_0.03_30_/_0.1)] lg:grid-cols-[0.9fr_1.1fr]"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[12.5px] font-extrabold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-extrabold tracking-[0.1em] text-primary">
                      STEP {index + 1} / {HOW_STEPS.length}
                    </span>
                  </div>
                  <p className="mt-3.5 text-[26px] leading-[1.22] font-extrabold tracking-[-0.05em]">
                    {step.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                  <span className="mt-4 inline-block rounded-full bg-accent px-[11px] py-[5px] text-[11.5px] font-bold text-accent-foreground">
                    {step.hint}
                  </span>
                </div>

                <div className="relative h-[280px] overflow-hidden rounded-[18px] border border-border bg-[oklch(0.975_0.012_30)]">
                  <Image
                    src={step.image}
                    alt={`${step.label} 화면`}
                    fill
                    sizes="(min-width:1024px) 560px, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
