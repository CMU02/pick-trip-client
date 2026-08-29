# 일정 생성 여정 단계 표기 3단계로 통일 (이슈 #103)

## 현재 상태

"일정을 만드는 여정"을 세 군데에서 다르게 센다.

| 위치 | 단계 수 | 라벨 |
|---|---|---|
| 생성 흐름 페이지 (eyebrow) | **4단계** | `Step 1 여행 조건` → `Step 2 콘텐츠 담기` → `STEP 3 일정 생성` → `Step 4 일정 완성` |
| 홈 `StepsSection` ("세 단계로 끝나요") | 3단계 | `지역과 날짜 선택` → `콘텐츠 담기` → `AI 일정 생성` |
| 대시보드 `ProgressStepper` ("여행 준비 N단계") | 3단계 | `지역 선택` → `콘텐츠 담기` → `일정 완성` |

`STEP 3 일정 생성`(pre-generate)과 `Step 4 일정 완성`(결과)은 같은 라우트
`/itinerary`, 같은 컴포넌트(`ItineraryClient`)로 `phase` 상태만 바뀔 뿐 페이지
이동이 없다. 커밋 `3088400` 전까지 둘 다 "Step 3"이었고, 결과 화면만 "Step 4"로
올리면서 홈·대시보드(3단계)와 어긋났다. step 1·3 라벨도 세 곳에서 제각각이고,
세 곳이 각자 하드코딩이라 공용 상수가 없어 재발하기 쉽다.

## 결정

1. 3단계로 통일. 라벨: **`여행 조건` · `콘텐츠 담기` · `AI 일정 생성`**.
2. pre-generate 화면 eyebrow: `Step 3 · AI 일정 생성` (번호 유지).
3. 결과 화면: 단계 번호 제거 → `✓ AI 일정 생성 완료`.
4. 케이싱 통일, breadcrumb 라벨 수정, 공용 단계 상수 추출.

## 고칠 것

### 1. 공용 단계 상수 신설 — `src/lib/journey.ts`

```ts
export const JOURNEY_STEPS = [
  { n: 1, label: "여행 조건", desc: "가고 싶은 지역과 출발일, 기간을 고릅니다." },
  { n: 2, label: "콘텐츠 담기", desc: "마음에 드는 장소를 바구니에 담고 우선순위를 정합니다." },
  { n: 3, label: "AI 일정 생성", desc: "이동 거리와 운영 시간을 고려한 일정이 만들어집니다." },
] as const;
```

### 2. 생성 흐름 eyebrow (4개 → 3개)

- `src/app/select/conditions/page.tsx` — `Step 1 · 여행 조건` (출력 동일, `JOURNEY_STEPS[0]` 참조)
- `src/app/contents/_components/ContentGrid.tsx` — `Step 2 · 콘텐츠 담기` (출력 동일, `JOURNEY_STEPS[1]` 참조)
- `src/app/itinerary/_components/PreGenerateView.tsx`
  - 히어로 배지 `STEP 3 · 일정 생성` → `Step 3 · AI 일정 생성` (소스 케이싱도 `Step`, `uppercase` 클래스가 렌더 담당)
  - breadcrumb 첫 크럼 `지역 선택` → `여행 조건` (링크 `conditionsHref` 유지), 현재 크럼 `일정 생성` → `AI 일정 생성`
- `src/app/itinerary/_components/ItineraryClient.tsx`
  - 결과 eyebrow `Step 4 · 일정 완성` → `✓ AI 일정 생성 완료`: `<p>`를 `inline-flex items-center gap-1`로, `<Icon name="check" size={13} />` + `{JOURNEY_STEPS[2].label} 완료`, `text-primary/70` → `text-primary`
  - 상단 주석(43-45행)의 "STEP 4 · 일정 완성" / "Step 1 → … → Step 4 완성" 흐름 설명을 3단계로 수정
- `src/app/dashboard/_components/DashStats.tsx` — 주석 문구만 라벨에 맞게 정리

### 3. 홈 `StepsSection` — `src/app/_components/StepsSection.tsx`

로컬 `STEPS` 삭제, `JOURNEY_STEPS` 참조. step 1 제목 `지역과 날짜 선택` → `여행 조건`.
헤딩 "세 단계로 끝나요" 유지.

### 4. 대시보드 `ProgressStepper` — `src/app/dashboard/_components/ProgressStepper.tsx`

로컬 `STEPS`의 `label`을 `JOURNEY_STEPS` 기준으로 교체. `key`(`region`/`contents`/`itinerary`)는
상태 매핑용이라 유지. `computeStepStatuses` / `currentStepNumber` 로직·시그니처
**변경 없음**. step 1 `지역 선택` → `여행 조건`, step 3 `일정 완성` → `AI 일정 생성`.

### 5. 테스트

- `ProgressStepper.test.tsx` — `aria-label` `"지역 선택: …"` → `"여행 조건: …"`, `"일정 완성: …"` → `"AI 일정 생성: …"`
- `StepsSection.test.tsx` — `"지역과 날짜 선택"` → `"여행 조건"`

## 범위 밖

- `computeStepStatuses` 임계값(바구니 2개 = 생성 가능) 로직.
- `PreGenerateView` 히어로 pill vs eyebrow 시각 통일(배경이 달라 의도적 차이) — 텍스트 케이싱만.
- `StepsSection` / `ProgressStepper` 카드 디자인.

## 검증

```bash
bunx tsc --noEmit
bun run lint
bun run test
bun run build
```

브라우저: 홈 3단계 카드 / `/select/conditions` `STEP 1 · 여행 조건` / `/contents`
`STEP 2 · 콘텐츠 담기` / `/itinerary` breadcrumb·`STEP 3 · AI 일정 생성` / 생성 후
결과 헤더 `✓ AI 일정 생성 완료` / 대시보드 ProgressStepper 3칸.
