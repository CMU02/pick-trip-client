# 홈 HOW? 섹션 — 스크롤 스택형 리디자인

- 이슈: CMU02/pick-trip-client#128
- 브랜치: `feat/128` (base main)
- 원본 작업 지시서: `HOW 섹션 (스택형) 구현 가이드.md`(사용자 제공, 다운로드 폴더)
- 디자인 시안: `HOW 섹션 (스택형).dc.html`(사용자 제공, 다운로드 폴더)

## 배경 — 무엇이 바뀌는가

지금 홈의 `HowItWorksSection`은 "AI가 무엇을 보고 순서를 정하는가"(이동 거리·운영
시간·식사 시간 3개 판단 기준)를 좌측 텍스트로, 우측에 정적 예시 일정 카드 1개를
보여준다. 인터랙션은 없다.

바뀌는 것:

1. 라벨이 `HOW IT WORKS` → `HOW?`로 바뀐다.
2. 우측 정적 예시 카드 1개가 **실제 화면 캡쳐 4장**(단계별 스크린샷)으로 바뀐다.
3. 스크롤에 따라 카드가 아래에서 올라와 페이드인하고, 다음 카드가 그 위로 겹쳐
   쌓이는 인터랙션이 생긴다(`sticky` + `motion`의 `scroll()` 콜백).
4. 단계 수가 3 → 4가 된다. 4번째("AI 일정 결과")는 새 단계가 아니라 3단계("AI 일정
   생성")의 완료 상태다 — `JOURNEY_STEPS`에 항목을 추가하지 않는다.

## 원본 지시서 대비 보정 사항

1. **판단 기준 3줄(이동 거리·운영 시간·식사 시간) 처리**: 원본 지시서 6번은 "문구를
   살려 헤더 아래나 카드 보조 라벨로 재배치"하라고 하는데, 디자인 시안(`.dc.html`)
   자체에는 이 3줄이 어디에도 없다(헤더는 `HOW?` + h2 + 설명 한 줄뿐). 시안을 그대로
   따르면 이 문구가 사라진다.
   → **헤더 설명 문구 아래에 아이콘 3개짜리 얇은 칩 로우**로 재배치한다(기존
   `CRITERIA` 배열의 아이콘·제목만 재사용, 긴 설명 문장은 카드 4개로 대체된 맥락과
   중복이라 생략). 시안의 카드 4개 구조는 그대로 두고, 헤더 아래에만 한 줄 추가.
2. **색상 값**: 시안의 `oklch(0.965 0.035 30)`(pill 배경)·`oklch(0.5 0.19 28)`(pill
   텍스트)는 기존 `--accent`/`--accent-foreground` 토큰(`oklch(0.955 0.04 30)` /
   `oklch(0.52 0.19 28)`)과 사실상 같은 값이라 토큰(`bg-accent`
   `text-accent-foreground`)으로 대체한다. 카드 테두리 `oklch(0.93 0.015 30)`도
   `--border`(`oklch(0.93 0.012 30)`)와 사실상 같아 `border-border`로 대체한다.
   섹션 배경·상하 보더처럼 기존 토큰과 다른 고유 색(`oklch(0.98 0.014 32)`,
   `oklch(0.94 0.02 30)`)은 시안 값 그대로 유지한다.
3. **폰트**: 시안은 `font-family:Paperlogy`를 헤딩에 명시하지만, 이 프로젝트는
   Paperlogy가 이미 전역 `font-sans`(`layout.tsx`의 `localFont`)라 별도 지정이
   필요 없다. 굵기 유틸리티(`font-extrabold` 등)만 쓴다.

## 1. `motion` 패키지 추가

```bash
bun add motion
```

스크롤 진행도에 따라 카드를 페이드인·오버랩시키는 데 쓴다. `animate()`를
`scroll()`에 넘기는 WAAPI 핸드오프 방식이 아니라 **콜백 방식**을 쓴다 — 콜백이
스크롤 진행도를 직접 반영해 스크럽이 확실하다.

## 2. 단계 데이터

`src/lib/journey.ts`의 `JOURNEY_STEPS`는 **수정하지 않는다**(대시보드
`ProgressStepper`·생성 흐름의 "Step N" 표기가 계속 참조). 4단계 데이터는
`HowItWorksSection.tsx` 안에 로컬 상수로 새로 둔다:

```ts
const HOW_STEPS: { label: string; desc: string; hint: string; image: string }[] = [
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
```

라벨·설명(1~3번)은 `JOURNEY_STEPS`와 같은 문구를 그대로 옮긴 것이다(상수를 import해서
쓰지 않는 이유는 4번째 항목이 섞여 들어가야 해서 — `JOURNEY_STEPS`는 3개 고정).
카드에 라우트 경로(`/select/conditions` 등)는 노출하지 않는다.

## 3. `HowItWorksSection.tsx` 전면 교체

기존 `CRITERIA`(제목만 재사용, 아래 헤더 칩으로) · `DEMO_ITEMS`(전체 삭제) ·
관련 마크업을 걷어내고 스택형 레이아웃으로 바꾼다. 클라이언트 컴포넌트로 전환.

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { Icon, type IconName } from "@/components/ui/icon";

// HOW? 섹션: 4단계를 스크롤에 따라 겹쳐 쌓이는 카드로 보여준다. 1~3단계는
// JOURNEY_STEPS와 같은 문구를 쓰지만, 4번째("AI 일정 결과")는 새 단계가 아니라
// 3단계("AI 일정 생성")의 완료 상태라 JOURNEY_STEPS에는 없다 — 이 섹션 전용 데이터다.
// (JOURNEY_STEPS는 대시보드 ProgressStepper·생성 흐름이 계속 참조하므로 건드리지 않는다.)
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

// 원래 CRITERIA의 제목·아이콘만 헤더 아래 얇은 칩으로 재배치한다(원본 지시서
// 6번: "문구를 살려 헤더 아래나 카드 보조 라벨로 재배치" — 시안 자체에는 이
// 3줄이 없어서 생긴 보정, docs/plan/home-how-section-stacked.md 참고).
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
              (p) => {
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
                (p) => {
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
```

규칙:

- `top`은 `96 + index * 16`(px) — 고정 Tailwind 클래스로 못 만드는 index별 값이라
  인라인 스타일로 둔다(`DayLegend`가 일차 색상을 인라인 스타일로 두는 것과 같은 이유).
- `lg:sticky`만 붙인다(모바일은 `static`). 카드 내부 그리드도 모바일에서 1열
  (`grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]`)로 내린다 — 시안엔 없지만 280px 높이
  이미지와 텍스트를 나란히 두면 좁은 화면에서 읽기 어렵다.
- `prefers-reduced-motion: reduce`거나 `window.matchMedia`가 없으면(jsdom 등)
  애니메이션 연결 자체를 건너뛴다 — 카드는 CSS 기준 `opacity:1`(스타일 미지정) 상태로
  이미 보이므로 JS가 안 돌아도 섹션이 비지 않는다.
- `import("motion")` 실패(네트워크 등)는 `.catch`로 흡수하고 정적 스택으로 둔다.

## 4. 캡쳐 이미지 4장 준비

- 경로: `public/how/step-1.png` ~ `step-4.png`.
- 사양: 16:10 비율 내외, 폭 1600px 이상, 실제 사용자 데이터 없이(테스트 계정 기준).
- 각 카드가 담당하는 실제 화면:
  1. 여행 조건 — `/select/conditions`
  2. 콘텐츠 담기 — `/contents`(바구니에 담긴 상태)
  3. AI 일정 생성 — 생성 중 로딩 화면(`GeneratingState`)
  4. AI 일정 결과 — `/itinerary` 결과 화면(지도 + 하루 타임라인이 함께 보이는 구도)
- Claude in Chrome으로 로컬 dev 서버(`bun run dev`)를 직접 조작해 캡쳐하고 16:10으로
  크롭해 저장한다.

## 5. 테스트 갱신

`HowItWorksSection.test.tsx`를 새 문구 기준으로 다시 쓴다(기존 `CRITERIA`
설명 문장·`DEMO_ITEMS`·"예시" 배지 검증은 삭제):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowItWorksSection } from "./HowItWorksSection";

describe("HowItWorksSection", () => {
  it("HOW? 라벨과 4단계 제목을 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("HOW?")).toBeInTheDocument();
    for (const label of ["여행 조건", "콘텐츠 담기", "AI 일정 생성", "AI 일정 결과"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("각 단계의 보조 라벨과 화면 캡쳐 alt를 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("평균 30초")).toBeInTheDocument();
    expect(screen.getByAltText("AI 일정 결과 화면")).toBeInTheDocument();
  });

  it("판단 기준 3가지(이동 거리·운영 시간·식사 시간)를 헤더 아래에 보여준다", () => {
    render(<HowItWorksSection />);

    for (const title of ["이동 거리", "운영 시간", "식사 시간"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});
```

`next/image`는 테스트 환경(jsdom)에서 실제 파일을 로드하지 않고 `<img>`로 렌더되므로
`getByAltText`로 충분히 검증된다. `motion` 동적 import는 위 3번 규칙대로 실패해도
렌더 자체는 막지 않으니 별도 모킹 없이 통과한다.

## 6. 하지 말 것

- `src/lib/journey.ts`의 `JOURNEY_STEPS`를 수정하지 않는다(대시보드
  `ProgressStepper`·생성 흐름이 계속 참조).
- 카드에 실제 라우트 경로를 노출하거나 클릭 가능한 링크로 만들지 않는다.
- 캡쳐 이미지에 실제 사용자 데이터(로그인된 실계정의 저장 일정 등)를 담지 않는다.
- 애니메이션은 `scroll()` 콜백 방식만 쓴다(`animate()` WAAPI 핸드오프 금지 — 스크럽이
  끊길 수 있다).

## 파일 변경 요약

| 파일 | 변경 |
| --- | --- |
| `package.json` / `bun.lock` | `motion` 의존성 추가 |
| `src/app/_components/HowItWorksSection.tsx` | 전면 교체 |
| `src/app/_components/HowItWorksSection.test.tsx` | 갱신 |
| `public/how/step-1.png` ~ `step-4.png` | 신규(앱 화면 캡쳐) |

## 검증

```bash
bun run test
bun run lint
bun run build
bun run dev   # 홈에서 HOW? 섹션까지 스크롤 → 4장의 카드가 순서대로 겹쳐 쌓이는지,
              # 모바일 너비에서 1열로 떨어지는지, prefers-reduced-motion에서 정적으로
              # 보이는지 확인
```
