# 일정 생성/조회 화면 코랄 리디자인

## Context

전체 화면 리디자인 4단계([[home-redesign]], [[dashboard-redesign]], [[explore-contents-redesign]]에 이어). `/select/conditions`, `/itinerary`, `/itineraries`를 대상으로 한다. 별도 디자인 핸드오프 문서는 없어 앞선 화면들에서 확립한 코랄 언어를 확장 적용한다.

`select/conditions`의 선택 pill류(`CompanionSelector`, `DurationSelector`, `StartDateInput`)와 `DayCard`, `ErrorState`, `TripSummary`, `AlternativePlacePicker`, `ItineraryResult`는 이미 전역 토큰(`border-primary`, `bg-accent`, `bg-primary` 등)만 사용해 코랄 테마가 자동 반영돼 있다. 실질적으로 손댈 부분은 amber/teal이 하드코딩된 콜아웃·배지·스피너다.

**`PRIORITY_SELECTED_CLASSES`(`src/types/basket.ts`)는 [[explore-contents-redesign]]의 `CATEGORY_BADGE_CLASSES`와 같은 이유로 손대지 않는다.** 우선순위(꼭 가기/가면 좋음/시간 남으면) 3단계를 색으로 구분하는 기능적 배지라 코랄로 통일하면 구분력이 사라진다.

## 구현

### TravelDateForm.tsx
- 선택 요약 배너: `border-teal-200 bg-teal-50 text-teal-700` → `border-primary/30 bg-primary/5 text-primary`

### GeneratingState.tsx
- 스피너: `border-amber-100 border-t-amber-500` → `border-primary/20 border-t-primary`, 아이콘 `text-amber-500` → `text-primary`

### PlaceItem.tsx
- 순서 배지: `bg-amber-100 text-amber-700` → `bg-primary/10 text-primary`
- 고정 배지: `bg-amber-50 text-amber-700` → `bg-primary/15 text-primary`
- AI 추천 이유 박스: `bg-teal-50 text-teal-700` / 아이콘 `text-teal-600` → `bg-primary/5 text-primary`

### ShareButton.tsx
- "복사됨" 텍스트: `text-teal-700` → `text-primary`

### SavedItinerariesList.tsx
- 아이콘 칩: `bg-amber-50 text-amber-500` → `bg-primary/10 text-primary`([[dashboard-redesign]] `TripCard`와 동일 패턴)

### ItineraryClient.tsx
- 저장 완료 문구: `text-teal-700` → `text-primary`
- 로그인 유도(loginPreview) 배너: `border-amber-300 bg-amber-50 text-amber-700` → `border-primary/30 bg-primary/5 text-primary`

### 변경 없음
- `CompanionSelector.tsx`, `DurationSelector.tsx`, `StartDateInput.tsx`, `DayCard.tsx`, `ErrorState.tsx`, `TripSummary.tsx`, `AlternativePlacePicker.tsx`, `ItineraryResult.tsx`, `itinerary/loading.tsx`(스켈레톤은 테마 무관 중립 회색 유지), `itineraries/page.tsx` — 이미 전역 토큰만 사용하거나 코랄과 무관한 중립색

## 테스트

기존 테스트는 텍스트/role 기준 검증이라 클래스명 변경으로 깨지지 않는다. 별도 테스트 추가 없이 기존 스위트로 회귀만 확인한다.

## 검증

```bash
bun run test
bun run lint
bun run build
```

추가로 `bun run dev`에서 `/select/conditions` → `/itinerary` 흐름과 `/itineraries`를 접속해 일정 생성 로딩 스피너, 순서/고정 배지, 저장 완료·로그인 유도 배너가 코랄 톤으로 보이는지 육안 확인.
