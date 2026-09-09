# 홈 HOW? 섹션 — 좌우 전환 캐러셀 리디자인

- 이슈: CMU02/pick-trip-client#129
- 브랜치: `feat/129` (base `feat/128`)
- 원본 작업 지시서: `HOW 섹션 (캐러셀) 구현 가이드.md`(사용자 제공, 다운로드 폴더)
- 디자인 시안: `HOW 섹션 (캐러셀).dc.html`(사용자 제공, 다운로드 폴더)
- 대체 대상: #128 스크롤 스택형(`docs/plan/home-how-section-stacked.md`) — 아직 main 미병합

## 배경 — 무엇이 바뀌는가

`feat/128`에서 만든 스크롤 스택형(`sticky` + `motion`의 `scroll()` 콜백으로 카드가
아래에서 올라와 겹쳐 쌓이는) HOW? 섹션을, **좌우로 전환되는 캐러셀**로 다시 바꾼다.

바뀌는 것:

1. 레이아웃이 세로 스택 4장 → 한 번에 한 장 보이는 가로 캐러셀로 바뀐다.
2. 스크롤 연동 애니메이션(`motion` 동적 import) 제거. 전환은 순수 CSS
   `transform: translateX` + `transition`으로 처리하고, 컴포넌트는 인덱스 상태만
   관리한다.
3. 3초 자동 전환 + 순환, 수동 컨트롤(이전·정지/재생·다음), 하단 진행 바가 추가된다.
4. 헤더 h2 문구가 `한 장씩 쌓이면 / 하루가 완성됩니다` → `네 화면이면 / 일정이 끝납니다`.
5. 4단계 구성(1~3 = `JOURNEY_STEPS` 문구, 4 = 3단계의 완료 상태 "AI 일정 결과")은
   스택형과 동일하게 유지한다. `JOURNEY_STEPS`에 항목을 추가하지 않는다.

## 원본 지시서 대비 보정 사항

1. **판단 기준 3줄(이동 거리·운영 시간·식사 시간) 처리**: 지시서 6번은 "문구를
   살려 헤더 아래나 슬라이드 보조 라벨로 재배치"하라고 하는데, 시안(`.dc.html`)
   헤더에는 `HOW?` + h2뿐이고 이 3줄이 없다. 슬라이드 보조 라벨(`hint`)은 이미
   단계별 다른 문구로 차 있어 여기에 끼우면 서사가 흐트러진다.
   → 스택형과 동일하게 **헤더 h2 아래에 아이콘 3개짜리 얇은 칩 로우**로 둔다
   (`CRITERIA` 배열의 아이콘·제목 재사용). 시안의 캐러셀 셸 구조는 그대로.
2. **색상 값**: 시안의 `oklch(0.965 0.035 30)`(pill 배경)·`oklch(0.5 0.19 28)`
   (pill 텍스트)는 `--accent`/`--accent-foreground`
   (`oklch(0.955 0.04 30)` / `oklch(0.52 0.19 28)`)와 사실상 같아 토큰
   (`bg-accent` `text-accent-foreground`)으로 대체한다. 슬라이드 프레임 테두리
   `oklch(0.93 0.015 30)`도 `--border`(`oklch(0.93 0.012 30)`)와 사실상 같아
   `border-border`로 대체. 섹션 배경 `oklch(0.98 0.014 32)`·상하 보더
   `oklch(0.94 0.02 30)`·큰 번호 `oklch(0.88 0.055 30)`처럼 기존 토큰과 다른 고유
   색은 시안 값 그대로 유지한다.
3. **폰트**: 이 프로젝트는 Paperlogy가 이미 전역 `font-sans`라 시안의
   `font-family:Paperlogy` 지정은 불필요. 굵기 유틸리티(`font-extrabold` 등)만 쓴다.
4. **`motion` 의존성**: 스택형이 추가한 `motion`(`^13.2.0`)은 이 캐러셀에서는
   쓰지 않는다. 다른 화면(있다면)에서 안 쓰면 `package.json`에서 제거해도 되지만,
   이 브랜치의 범위를 넘으므로 **일단 그대로 둔다**(미사용 의존성만 남음).
5. **진행 바 재시작**: 시안은 키프레임 이름을 `howfill-a`/`howfill-b`로 번갈아
   바꿔 CSS 애니메이션을 강제 재생한다. React에서는 진행 바 요소에
   `key={`${index}-${tick}`}`를 주는 편이 단순하다 — 키가 바뀌면 요소가 새로
   마운트되며 애니메이션이 처음부터 다시 돈다. 키프레임은 하나(`how-bar-fill`)면 된다.

## 1. 동작 정의 (지시서 1번 그대로)

- 슬라이드 4장, 한 번에 한 장. 트랙에 `transform: translateX(-${index * 100}%)`.
- 3초(`INTERVAL = 3000`)마다 다음 슬라이드. 마지막 다음은 첫 장(`% length`).
- 컨트롤 3개는 캡쳐 프레임 우하단(`bottom-3.5 right-3.5`, `gap-2`)에 배경 없이
  따로 배치: 이전 ◀ · 일시정지/재생 · 다음 ▶. 각 28px 원형, 평상시 아이콘만,
  hover한 버튼만 흰 원 배경으로 반전. 밝은 캡쳐 대비를 위해 아이콘에
  `drop-shadow` 약간.
- 수동 전환(컨트롤·진행 바 클릭)은 자동 타이머를 리셋한다.
- 정지 버튼은 자동 전환·진행 바를 멈춘 상태로 둔다. 다시 누르면 재생.
- 하단 4개 바 클릭 시 해당 단계로 즉시 이동. 현재 바는 3초 동안 채워지며 남은
  시간을 보여준다. 지나간 바는 채워진 상태, 이후 바는 빈 상태.
- 캐러셀 영역 `mouseenter` 시 자동 전환·진행 바 일시정지, `mouseleave` 시 재개.
- `document.visibilityState`가 `hidden`이면 일시정지(백그라운드 탭 타이머 몰림 방지).
- `prefers-reduced-motion: reduce`면 자동 전환을 아예 켜지 않는다(수동 컨트롤만).
- 전환 트랜지션: `transform .68s cubic-bezier(.36,.07,.19,.97)`.
- 키보드: 캐러셀에 포커스가 있을 때 ← / → 로 이전·다음.

## 2. 슬라이드 데이터

`src/lib/journey.ts`의 `JOURNEY_STEPS`는 **수정하지 않는다**. 4단계 데이터는
`HowItWorksSection.tsx` 로컬 상수로 둔다(스택형과 동일, `idx` 표기는 렌더에서
`index + 1`로 계산하므로 상수엔 넣지 않는다):

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
    desc: "하루 단위 순서와 배치 이유를 지도와 함께 확인하고, 빼고 다시 만들 수 있습니다.",
    hint: "일정 저장 · 공유",
    image: "/how/step-4.png",
  },
];
```

카드에 라우트 경로(`/select/conditions` 등)는 노출하지 않고, 클릭 가능한 링크로도
만들지 않는다.

## 3. 레이아웃 (지시서 3번)

- **섹션**: `border-y border-[oklch(0.94_0.02_30)] bg-[oklch(0.98_0.014_32)]`,
  내부 `mx-auto max-w-7xl px-10 pt-21 pb-24`.
- **헤더**: `HOW?`(13px / `font-extrabold` / `tracking-[0.14em]` / `text-primary`)
  + h2 40px `leading-[1.18] tracking-[-0.05em]` (`네 화면이면<br>일정이 끝납니다`).
  그 아래 판단 기준 3칩(보정 1번). 별도 설명문·버튼 없음.
- **캐러셀 셸**: `mt-*` `rounded-[32px]` 흰 배경 `border-border`
  `shadow-[0_2px_6px_oklch(0.4_0.03_30_/_0.04),0_28px_60px_oklch(0.4_0.03_30_/_0.09)]`
  `overflow-hidden`. 이 요소에 `onMouseEnter`/`onMouseLeave`,
  `aria-roledescription="carousel"`, `aria-label="일정 만드는 4단계"`.
- **트랙**: `flex` + `transform: translateX(...)` +
  `transition: transform .68s cubic-bezier(.36,.07,.19,.97)`. 바깥에
  `overflow-hidden` 래퍼.
- **슬라이드**: `flex-[0_0_100%] min-w-full`, 내부
  `grid lg:grid-cols-[1.5fr_0.75fr] gap-7.5 items-center p-6.5`.
  비활성 슬라이드는 `aria-hidden` + 내부 인터랙티브 요소 `tabIndex={-1}`(또는
  `inert` 대신 포커스 차단). `role="group"` `aria-roledescription="slide"`
  `aria-label="4개 중 n번째"`.
  - **캡쳐 프레임**: `rounded-[22px] overflow-hidden border border-border`,
    상단 32px 크롬 바(점 3개), 그 아래 `relative` 이미지 영역.
    데스크톱 높이 460px, 모바일 `aspect-[16/10]`.
    `next/image` `fill` `sizes="(min-width:1024px) 720px, 100vw"` `object-cover`.
    우하단에 컨트롤 3개(`absolute bottom-3.5 right-3.5 flex gap-2`).
  - **텍스트**: 큰 번호 56px `font-extrabold tracking-[-0.06em]`
    `text-[oklch(0.88_0.055_30)]` (`0${index + 1}`) → `STEP {index+1} / 04`
    (11px `font-extrabold tracking-[0.1em] text-primary`) → 제목 28px
    `font-extrabold tracking-[-0.05em]` → 설명 15px `leading-[1.8]`
    `text-muted-foreground` → 보조 라벨 pill
    (`bg-accent text-accent-foreground` `rounded-full` 12px `font-bold`).
- **컨트롤 버튼**: `<button type="button">`, `h-7 w-7 rounded-full grid place-items-center`,
  기본 `text-[oklch(0.45_0.02_30)]` 배경 없음, `hover:bg-white hover:text-[oklch(0.24_0.02_30)]`,
  `transition-colors`. 아이콘 12px SVG(`drop-shadow` 약간). 모바일에서 탭 타겟만
  44px로(`before:absolute before:-inset-2` 같은 확장 히트 영역, 아이콘 크기 유지).
  `aria-label`: `"이전 단계"` / `"자동 전환 정지"`(정지 상태면 `"자동 재생"`) / `"다음 단계"`.
- **하단 진행 바**: `px-6.5 pb-6` `flex items-center gap-3.5`. 4개 균등
  (`flex-1`), 각각 `<button>`(`aria-label="{label}(으)로 이동"`):
  - 트랙 `h-1 rounded-full bg-[oklch(0.93_0.02_30)] overflow-hidden`
  - 채움 `h-full bg-primary origin-left`:
    - `index`보다 앞: `scaleX(1)` 고정
    - `index`와 같음: `key={`${index}-${tick}`}` +
      `animation: how-bar-fill 3s linear forwards`,
      `animationPlayState: paused ? "paused" : "running"`
    - `index`보다 뒤: `scaleX(0)`
  - 아래 단계명 12px `font-bold`, 현재는 `text-[oklch(0.5_0.19_28)]` 나머지
    `text-[oklch(0.6_0.015_30)]`, `transition-colors`.
- 키프레임 `how-bar-fill`은 `globals.css`에 추가
  (`from { transform: scaleX(0) } to { transform: scaleX(1) }`).

## 4. 상태 관리 (지시서 5번 예시 반영)

```tsx
"use client";

const INTERVAL = 3000;

// state: index, tick(진행 바 재시작 키), hover, stopped, reduced(prefers-reduced-motion)
// paused = hover || stopped || reduced || document.hidden
// - setInterval(INTERVAL): paused면 skip, 아니면 index = (index + 1) % length, tick++
// - go(next): index = (next + length) % length, tick++, 타이머 재시작
// - 컨트롤: goPrev = go(index - 1) / toggle = setStopped(v => !v) + tick++ / goNext = go(index + 1)
// - 진행 바 dot 클릭: go(n)
// - mouseenter/leave: setHover
// - visibilitychange 리스너: 강제 리렌더(또는 hidden 상태 반영)
// - keydown(캐러셀 셸): ArrowLeft = goPrev, ArrowRight = goNext
```

- `prefers-reduced-motion`은 `useEffect`에서 `matchMedia`로 읽어 상태에 저장하고
  변화 리스너도 건다. `window.matchMedia`가 없으면(jsdom) `reduced = false`로 두되,
  자동 전환 타이머는 **테스트에서 문제되지 않도록** `INTERVAL`이 길어 테스트 런타임
  내 자동 전환이 일어나지 않는다(3초). 필요 시 테스트에서 `vi.useFakeTimers()`는
  쓰지 않고 컨트롤 클릭만 검증한다.
- 타이머는 `useRef`에 저장, `useEffect` cleanup에서 `clearInterval`.

## 5. `HowItWorksSection.tsx` 전면 교체

스택형 마크업(`lg:sticky`, `cardRefs`, `import("motion")`, `scroll()` 콜백)을
전부 걷어내고 위 캐러셀 구조로 바꾼다. `CRITERIA` 상수와 헤더 칩 로우는 유지.

## 6. 캡쳐 이미지 4장 갱신

- 경로: `public/how/step-1.png` ~ `step-4.png` (기존 파일 교체).
- 사양: 16:10 비율 내외, 폭 1600px 이상, 실제 사용자 데이터 없이(테스트 계정 기준).
- 각 슬라이드가 담당하는 실제 화면:
  1. 여행 조건 — `/select/conditions`
  2. 콘텐츠 담기 — `/contents`(바구니에 담긴 상태)
  3. AI 일정 생성 — 생성 중 로딩 화면(`GeneratingState`)
  4. AI 일정 결과 — `/itinerary` 결과 화면(지도 + 하루 타임라인이 함께 보이는 구도)
- Claude in Chrome으로 로컬 dev 서버(`bun run dev`)를 직접 조작해 캡쳐하고 16:10으로
  크롭해 저장한다. 캡쳐 전까지는 기존 `step-*.png`로 컴포넌트를 완성·검증한다.

## 7. 테스트 갱신 (`HowItWorksSection.test.tsx`)

기존 스택형 테스트를 캐러셀 기준으로 다시 쓴다:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByAltText(/AI 일정 결과/)).toBeInTheDocument();
  });

  it("판단 기준 3가지(이동 거리·운영 시간·식사 시간)를 헤더 아래에 보여준다", () => {
    render(<HowItWorksSection />);
    for (const title of ["이동 거리", "운영 시간", "식사 시간"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("다음 단계 버튼을 누르면 트랙이 이동한다", () => {
    render(<HowItWorksSection />);
    const track = screen.getByTestId("how-carousel-track");
    expect(track).toHaveStyle({ transform: "translateX(-0%)" });
    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(track).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("자동 전환 정지 버튼을 누르면 라벨이 자동 재생으로 바뀐다", () => {
    render(<HowItWorksSection />);
    fireEvent.click(screen.getByRole("button", { name: "자동 전환 정지" }));
    expect(screen.getByRole("button", { name: "자동 재생" })).toBeInTheDocument();
  });
});
```

`next/image`는 jsdom에서 `<img>`로 렌더되므로 `getByAltText`로 검증된다.
트랙 요소에 `data-testid="how-carousel-track"`를 둔다.

## 8. 하지 말 것

- `src/lib/journey.ts`의 `JOURNEY_STEPS` 수정 금지(대시보드 `ProgressStepper`·
  생성 흐름이 계속 참조).
- 슬라이드에 실제 라우트 경로 노출·클릭 링크화 금지.
- 캡쳐 이미지에 실제 사용자 데이터(로그인된 실계정 저장 일정 등) 금지.
- `prefers-reduced-motion`에서 자동 전환 강행 금지(수동 컨트롤만 남긴다).

## 파일 변경 요약

| 파일 | 변경 |
| --- | --- |
| `src/app/_components/HowItWorksSection.tsx` | 전면 교체(스택형 → 캐러셀) |
| `src/app/_components/HowItWorksSection.test.tsx` | 갱신 |
| `src/app/globals.css` | `@keyframes how-bar-fill` 추가 |
| `public/how/step-1.png` ~ `step-4.png` | 실제 화면 캡쳐로 교체 |

## 검증

```bash
bun run test
bun run lint
bun run build
bun run dev   # 홈 HOW? 섹션: 3초 자동 전환·순환, 컨트롤 3개, 진행 바 클릭 이동,
              # 마우스 오버 시 정지, 모바일 1열 + 44px 탭 타겟, reduced-motion에서 정적
```
