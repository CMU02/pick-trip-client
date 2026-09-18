# 홈 히어로 지역 슬라이더 v2 리디자인

- 이슈: anthonyko0627/pick-trip-client#9
- 브랜치: `feat/9`
- 디자인 원본: `홈 히어로 지역 슬라이더 v2.dc.html` (사용자 제공, 저장소 밖 파일)

## 목표

홈 최상단 히어로를 "가운데 한 장 + 좌우로 흐리게 잘린 이전/다음 사진" 슬라이더로
교체한다. 이동 거리 / 운영 시간 / 식사 시간 칩 3개를 제거하고 그 여백만큼 사진을
확대(800×440 → 1020×561, 20:11 비율 유지)한다.

## 1. 구성

- 헤더(66px) 아래 한 섹션. 배경 `oklch(0.98 0.012 32)`, 하단
  `border-[oklch(0.94_0.012_30)]`
- 위쪽 텍스트 블록(중앙 정렬) → 사진 스테이지 → 컨트롤 바 순서
- v1(`HeroSection.tsx`) 대비 변경점
  - 이동 거리 / 운영 시간 / 식사 시간 **칩 3개 제거**
  - 본문 문단 16px → 18px, 2줄 고정
  - CTA 버튼 50px → 58px, 17px/800, 주 버튼에 컬러 섀도우 + 보조 버튼 브랜드색
    2px 테두리

## 2. 텍스트 블록

컨테이너: `mx-auto max-w-[1240px] px-10 pt-16 text-center`

| 요소 | 값 |
|---|---|
| 배지 | `PICK TRIP` · 11.5px / 800 / `tracking-[0.16em]` / `bg-primary text-white` / pill |
| h1 | 46px / 1.16 / 800 / `tracking-[-0.05em]` / `max-w-[760px]`, 2줄 · "나만의 일정"만 `text-primary` |
| 문단 | 18px / 1.66 / `tracking-[-0.02em]` / `max-w-[680px]` / `oklch(0.42 0.016 30)` — 2줄로 끊는다 |
| CTA | `mt-8`, `gap-3.5`, 중앙 정렬 |

CTA 두 개는 반드시 `box-sizing:border-box`(Tailwind 기본)로 높이 58px을 맞춘다.
테두리 2px이 높이에 포함되지 않으면 두 버튼 높이가 4px 어긋난다.

- 주 버튼 `콘텐츠 둘러보기` → `/contents`: `h-[58px] px-8.5 rounded-2xl bg-primary
  text-white text-[17px] font-extrabold shadow-[0_12px_26px_oklch(0.5_0.19_28_/_0.34)]`
  + 우측 재생형 화살표 16px
- 보조 버튼 `AI 일정 살펴보기` → `/ai-schedule`: `h-[58px] px-7.5 rounded-2xl
  border-2 border-primary bg-white text-[oklch(0.44_0.19_28)]`

카피는 디자인 그대로 유지한다.

> 리포지토리 실제 라우트 기준 조정: 콘텐츠 둘러보기는 `/explore`(또는 조건
> 포함 `/contents`), AI 일정 살펴보기는 `/select/conditions?regions=...`로
> 기존 `HeroSection.tsx` 라우트를 그대로 쓴다. `/ai-schedule`은 존재하지 않는
> 라우트라 원본 mock 그대로 쓰지 않는다.

## 3. 사진 스테이지

- 래퍼: `relative h-[604px] mt-13`
- 슬라이드 6장(지역 3곳 × 2장), 모두 `absolute top-0 left-1/2 w-[1020px]
  h-[561px] rounded-[26px] overflow-hidden`
  - 배경 `oklch(0.9 0.01 30)`, `shadow-[0_30px_70px_oklch(0.4_0.03_30_/_0.18)]`
  - 전환 `transform 760ms cubic-bezier(.36,.07,.19,.97), filter 760ms, opacity 760ms`
- 위치 규칙 (`offset = 700`)

| 상태 | transform | filter | opacity | z |
|---|---|---|---|---|
| 현재 | `translateX(-50%)` | none | 1 | 3 |
| 직전/직후 | `translateX(calc(-50% ± 700px)) scale(0.86)` | `blur(5px) brightness(0.82)` | 0.9 | 2 |
| 그 외 | `translateX(calc(-50% ± 1120px)) scale(0.72)` | `blur(8px) brightness(0.8)` | 0 | 1 |

- 각 슬라이드 하단: 위로 올라가는 그라데이션(150px,
  `oklch(0.14 0.02 32 / 0.72)` → transparent) + 지역 pill + 장소명
- 좌우 빈 영역은 클릭 영역(`w-[calc(50%-510px)]`, 배경 없음) = 이전/다음

## 4. 이미지 (미정 — 나중에 채운다)

지금은 소스를 비워 둔다. 확정 전까지는 `bg-[oklch(0.9_0.01_30)]` 단색
플레이스홀더로 둔다.

```ts
// src/lib/hero-slides.ts
export type HeroSlide = {
  region: "하동" | "영주" | "예천";
  place: string;   // 장소명 — 미정
  image: string;   // 미정: public/hero/*.jpg 또는 API 이미지 URL
};

export const HERO_SLIDES: HeroSlide[] = [
  { region: "하동", place: "", image: "" },
  { region: "하동", place: "", image: "" },
  { region: "영주", place: "", image: "" },
  { region: "영주", place: "", image: "" },
  { region: "예천", place: "", image: "" },
  { region: "예천", place: "", image: "" },
];
```

확정 시 지킬 조건

- 가로:세로 **20:11** (1020×561 기준), 원본 폭 2040px 이상
- `object-cover`, 첫 장만 `priority` / `fetchPriority="high"`, 나머지는
  `loading="lazy"`
- 저작권 확인된 사진만. 외부 URL은 `http` 대신 `https`로 고정한다.

## 5. 슬라이더 상태

전환은 CSS transform이 담당하고, 리액트는 인덱스만 들고 있는다.
**진행 바 채움은 state로 돌리지 않는다** — 50ms마다 리렌더하면 히어로 전체가
다시 그려진다. ref에 직접 `scaleX`를 써서 렌더 사이클 밖에서 처리한다(원본
DC와 동일한 방식).

> 원본 가이드는 TanStack Query(서버 prefetch + `HydrationBoundary`)와 TanStack
> Router(`createFileRoute`, search param) 사용을 전제로 적혀 있었다. 이 저장소는
> Next.js App Router이고 TanStack Router는 쓰지 않으며, `fetchHeroSlides`
> 엔드포인트도 아직 없다(이미지 자체가 미정). 지금은 `HERO_SLIDES`를 정적
> 상수로 바로 import해서 쓰고, 인덱스는 로컬 state로 관리한다(공유 링크로 특정
> 사진을 열 요구사항이 없어 URL 동기화도 생략). 실제 이미지/데이터 소스가
> 정해지고 나서 필요하면 `useQuery`로 승격한다.

- 슬라이드 DOM은 6개를 계속 유지한다(마운트/언마운트 없음). 전환은
  transform/opacity만 바꾼다.
- `document.hidden`이면 타이머를 건너뛴다. 섹션이 화면에서 벗어나면
  (`IntersectionObserver`) 타이머를 멈춘다.
- `prefers-reduced-motion: reduce`에서는 자동 전환과 blur 전환을 끄고 페이드만
  남긴다.
- 자동 전환 간격 기본 4500ms, 수동 조작 시 진행도를 0으로 리셋한다.

## 6. 컨트롤 바

- `mx-auto max-w-[1020px] px-10 pb-14 flex items-center gap-4.5`
- 좌: 이전 / 일시정지·재생 / 다음 — 34px 원형, `border-[oklch(0.9_0.012_30)]`,
  hover 시 `bg-[oklch(0.96_0.01_30)]`
- 중앙: 6분할 진행 바(두께 3px, 트랙 `oklch(0.9 0.012 30)` / 채움
  `bg-primary`), 클릭 시 해당 장으로 이동
- 우: `01 / 06` 카운터 13px / 800 / `tracking-[0.06em]`

## 7. 반응형

- `< 1100px`: 슬라이드 폭을 `min(1020px, 92vw)`로, 높이는 `aspect-[20/11]`로
  계산한다(비율 고정).
- `< 768px`: 좌우 흐린 사진을 숨기고 가운데 한 장만. h1 32px, 문단 16px, CTA는
  세로 스택 + `w-full`(높이 52px 유지).
- 좌우 클릭 영역은 모바일에서 제거하고 스와이프로 대체한다. 컨트롤 버튼은
  44px 이상.

## 구현 파일

- `src/lib/hero-slides.ts` (신규) — `HeroSlide` 타입 + `HERO_SLIDES` 스캐폴드
- `src/app/_components/HeroSection.tsx` (수정) — 텍스트 블록만 서버 컴포넌트로
  유지, 사진 스테이지는 클라이언트 컴포넌트로 위임
- `src/app/_components/HeroSlider.tsx` (신규, `"use client"`) — 슬라이드
  전환/컨트롤 바/타이머/IntersectionObserver/prefers-reduced-motion
- `src/app/_components/HeroSection.test.tsx` (수정), `HeroSlider.test.tsx`
  (신규)
