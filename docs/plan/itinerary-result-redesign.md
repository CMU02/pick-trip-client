# AI 일정 결과 화면 리디자인 — 일차 탭 + 시간축 타임라인 + 고정 지도

- 이슈: #111
- 브랜치: `feat/111` (worktree `.claude/worktrees/feat-111`, base `origin/main` = 3941f13)
- 시안: `AI 일정 결과 리디자인.dc.html` / `task-itinerary-result-redesign.md` (저장소 밖, 사용자 지시서로 대체)

## 목표

일정 결과 화면을 **일차 탭 + 시간축 타임라인(좌) / 고정 지도 + 요약(우)** 구조로 바꾼다.
데이터 계약(API 응답 타입, 스토어, 훅 시그니처)은 **변경하지 않고** 이미 있는 값만 재배치한다.

쓸 수 있는 값: `Day.date`, `Day.totalTravelMinutes/totalTravelKm`, `Day.dayNotes`,
`Item.startTime/endTime/reason/pinned/notes`, `ItineraryMapDay.points`,
`RouteResult.segments/totalDistanceMeters/totalDurationSeconds`.

## 지금 → 바꿀 상태

- 지금: 일차 카드 세로 나열 + 개요 지도 1개 + 일차 카드마다 작은 지도(지도 3~4회 반복).
  이동 시간·거리는 카드 헤더 한 줄로만.
- 바꾼 뒤: 지도는 화면에 **하나만**, 사이드바 sticky로 선택 일차를 따라감.
  카카오 모빌리티 구간값(`route.segments`)을 장소 사이에 노출해 순서 근거를 보여줌.

## 건드릴 파일

```
src/app/itinerary/_components/ItineraryClient.tsx   (ItineraryResultLayout)
src/app/itinerary/_components/ItineraryResult.tsx
src/app/itinerary/_components/DayCard.tsx
src/app/itinerary/_components/PlaceItem.tsx
src/app/itinerary/_components/ItineraryMap.tsx      (props만 확장)
신규 src/app/itinerary/_components/DayTabs.tsx
신규 src/app/itinerary/_components/DayRouteLegs.tsx
신규 src/app/itinerary/_components/DayMapPanel.tsx  (지도+구간목록+카카오맵 링크 묶음, 사이드바/단독 공용)
```

## 아키텍처 판단 (지시서에 없던 지점)

`ItineraryResult`는 레이아웃 밖에서도 단독으로 쓰인다: `share/[id]/page.tsx`(SSR),
`itineraries/_components/SavedItinerariesList.tsx`("보기" 펼침). 이 경우 사이드바가 없다.

- **일차 선택 상태**: URL 쿼리 금지(공유 SSR도 같은 컴포넌트). `ItineraryResult`가
  `selectedDayIndex?` / `onSelectDay?`를 받는 **controlled-or-uncontrolled** 컴포넌트.
  prop 없으면 내부 `useState<number>(0)`.
- **지도 위치**:
  - 레이아웃 안(`ItineraryClient` 흐름): `ItineraryResultLayout`이 선택 상태를 소유하고
    사이드바에 `DayMapPanel`을 sticky로 렌더. `ItineraryResult`에는 `hideMap` 전달.
  - 레이아웃 밖(share, saved list): `ItineraryResult`가 `DayCard` 아래 `DayMapPanel`을
    1열 전체폭으로 직접 렌더(사이드바가 없으므로).
- **`ItineraryResultLayout`은 render-prop**로 바뀐다: `children: (selectedDayIndex, onSelectDay) => ReactNode`.
  3개 호출부(preview/saving, loginPreview, SavedItineraryPanel)가 arrow로 감싼다.
- `mapData`(`ItineraryMapData`)는 호출부가 계산해 `ItineraryResultLayout`에 넘긴다.
  - preview/saving·loginPreview: 이미 `useItineraryMapData(previewDays)` 있음.
  - `SavedItineraryPanel`: `useItineraryMapData(editor.days)` 추가.
- **sticky top**: 지시서는 `lg:top-6`(24px)지만 전역 헤더가 `sticky top-0 h-[66px]`라
  그대로 두면 지도가 헤더 밑에 깔린다 → `lg:top-[86px]` 유지(66 + 20). 상단 스페이서(61px)는
  별개(탭+간격 높이 맞춤)라 지시서대로.

## 작업 순서

### 1. 레이아웃 — `ItineraryResultLayout` (ItineraryClient.tsx)

- 그리드 `lg:grid-cols-[minmax(0,1fr)_380px]`, `gap-6.5`.
- 왼쪽 `min-w-0`.
- 오른쪽 `aside self-stretch`: `aria-hidden` 스페이서 `hidden h-[61px] lg:block` +
  `flex flex-col gap-3.5 lg:sticky lg:top-[86px]`.
- props: `region, duration, travelDate, days, mapData, actions, sidebar, children(render-prop)`.
- 헤더 메타 한 줄 추가(H1 아래): `{M월 D일} 출발 · 장소 {N}곳 · 차량 이동 {합계시간} · {합계km}`.
  - 시간·거리: 전체 일차 `route` 합계, 없으면 `sumDayTravel(days)` 폴백. 값 없으면 그 조각 생략.
- 사이드바 = `<DayMapPanel days mapData selectedDayIndex />` + `sidebar` prop(TripSummary + TripDistanceCard).

### 2. `DayTabs.tsx` 신규

- props: `days: Day[]`, `mapDaysByIndex: Map<number, ItineraryMapDay>`, `selectedIndex`, `onSelect`.
- `days.length <= 1` → `null` 반환(호출부가 스페이서 유지).
- 컨테이너 `w-fit rounded-[14px] bg-muted p-[5px] flex gap-2`.
- 탭 버튼 `px-[18px] py-[9px] rounded-[10px] text-[13.5px] font-bold`,
  선택 `bg-card shadow-sm text-foreground` / 미선택 `text-muted-foreground`.
- 라벨 `{n}일차` + 작게 `{items.length}곳 · {km}` (km = route.totalDistanceMeters/1000 또는 day.totalTravelKm, `formatDistanceKm`, 없으면 곳 수만).
- `role="tablist"` / 각 버튼 `role="tab" aria-selected`.

### 3. `DayCard` + `PlaceItem` 개편

**DayCard**
- 카드 안 지도 렌더 삭제(`mapDay.points` 블록 제거). `mapDay`는 여전히 받되 `route`만 씀.
- 헤더: 좌 = 번호 배지 + `{n}일차` + `formatDayDate(day.date)`. 우 = 라벨/값 3개
  - `출발` = `day.items[0]?.startTime` (없으면 생략)
  - `차량 이동` = route 있으면 `totalDurationSeconds/60` + `totalDistanceMeters/1000`,
    없으면 `day.totalTravelMinutes/totalTravelKm` (기존 우선순위 유지)
  - `장소` = `day.items.length`곳
- `day.dayNotes` amber 박스 유지(`Icon name="alert"`).
- 본문 3열 그리드 `grid-cols-[62px_26px_minmax(0,1fr)] gap-3.5`:
  - 장소 행: `PlaceItem` (아래) — 1열 시각, 2열 번호원+레일, 3열 카드
  - 이동 구간 행: 장소 사이마다, `mapDay.route?.segments[i]` 있을 때만
    - 1열 빈칸 / 2열 점(8px)+레일 / 3열 pill: `Icon compass-outline` + `차로 {분} · {km}` (`RouteSegment` → `formatTravelMinutes(Math.round(durationSeconds/60))`, `formatDistanceKm(distanceMeters/1000)`)
    - 도로명 자리 비움
  - `route` 없으면 구간 행 아예 없음(직선 근사 금지)

**PlaceItem** — 3열 그리드의 한 행(1열 시각 / 2열 번호원+레일 / 3열 카드)
- 시각: `startTime` (15px extrabold primary `tabular-nums`) + 아래 `endTime` (11px muted). 없으면 빈칸.
- 번호 원 26px primary 흰 테두리 + 아래 2px 레일.
- 카드: 제목 / (카테고리 칩은 데이터에 없음 → 생략) / `pinned`면 고정 칩(`Icon pin`) /
  `머무는 시간 {X}` = `endTime - startTime` **둘 다 있을 때만** (분 → `formatTravelMinutes`).
  우측 `chevron-up`/`chevron-down` + `대체` 버튼(= 기존 `editable` 로직 그대로) + 삭제 2단 확인 유지.
- `item.reason` primary tint 박스 + `Icon wand`. `item.notes` amber 박스 유지.
- props에 `stayMinutes` 계산은 컴포넌트 내부에서. `isFirst/isLast`로 레일 상/하단 처리.

### 4. `DayRouteLegs.tsx` 신규 (사이드바 지도 아래 구간 목록)

- props: `points: RoutePoint[]`, `route: RouteResult | null`.
- `route` 없으면 `null`.
- 각 세그먼트: `{i+1}→{i+2}  {points[i].title} → {points[i+1].title}  {분} · {km}` 한 줄,
  가운데 텍스트 `truncate`.

### 5. `DayMapPanel.tsx` 신규

- props: `days: Day[]`, `mapData: ItineraryMapData`, `selectedDayIndex: number`.
- 선택 일차의 `ItineraryMapDay` = `mapData.days`에서 `days[selectedDayIndex].dayIndex`로 조회.
- 지도 카드: `rounded-[20px] overflow-hidden`, 높이 300px → `ItineraryMap variant="day" heightClassName`.
- 지도 아래 `DayRouteLegs`.
- 맨 아래 `카카오맵에서 경로 열기` 링크(마지막 점 기준):
  `https://map.kakao.com/link/to/{lastTitle},{lat},{lng}` `target="_blank" rel="noopener noreferrer"`.
  좌표 있는 점 없으면 링크 생략.
- 좌표 있는 점 0개면 패널 자체를 렌더 안 함(레이아웃 사이드바에서도).

### 6. `ItineraryMap.tsx` props 확장

- `heightClassName?: string` 추가 (기본 = 기존 `variant` 기반). `variant="day"`에서 `h-[300px]` 주입용.
- **라벨 오버레이 겹침 처리**(오버레이 라벨을 새로 붙이는 경우에 한함):
  - 우측 절반 마커는 라벨 왼쪽으로(`xAnchor` 반전)
  - 화면좌표 96px 이내 앞 마커와 겹치면 라벨 숨기고 번호만
  - 현재 구현은 번호만 있는 원형 마커라 **겹침 처리 불필요**. 라벨 오버레이는 추가하지 않는다(판단: 시안의 라벨 겹침 문제를 애초에 안 만든다). → 이 항목은 "라벨 안 붙임"으로 종결.
- 개요 지도/일차카드 지도 삭제에 따라 `variant="overview"` 사용처가 사라지지만 타입은 유지(share meta 등 영향 없음). 실제로는 `variant` 둘 다 유지.

### 7. `ItineraryResult.tsx` 개편

- `<h2>생성된 일정</h2>` 제거 → 그 자리에 `DayTabs`. (`headerAction`은 탭 행 우측 정렬, 탭 없어도 행 유지)
- `selectedDayIndex` controlled-or-uncontrolled. `onSelectDay`.
- `days.length === 0` 빈 상태 문구 유지.
- `days.length === 1` && DayTabs null → 대신 `<div className="h-[45px]" aria-hidden />` (지도 정렬).
- 선택 일차만 `<DayCard>` 렌더.
- `adjustments` 배너: **지금 문구·스타일 유지**, 위치는 탭 아래 / 카드 위(`mt-4`).
- `hideMap` prop: true면 지도 안 그림. false/미지정이면 `DayCard` 아래 `<DayMapPanel>` 1열 렌더.
- `mapData` 없으면 기존처럼 내부 `useItineraryMapData(days)` 폴백(standalone).
- editor 저장 버튼/에러/빈날 안내/`AlternativePlacePicker` 블록 그대로.

### 8. TripSummary

- `출발 시각`(첫 날 첫 item `startTime`), `총 이동 거리`(route 합계) 2줄 추가.
- 편집 중(`editor.isDirty`) 안내 문구 처리 유지(SavedItineraryPanel의 인라인 dl).
  → `SavedItineraryPanel`의 인라인 `<dl>`에도 동일 2줄 추가.
- `travelSummary`에 이미 `totalKm` 있음 → `총 이동 거리` = `formatDistanceKm(travelSummary.totalKm)`.
  `출발 시각`은 새 prop `departureTime?: string | null`로 주입(호출부가 `days[0].items[0].startTime`).

### 9. TripDistanceCard

- 변경 없음.

## 수치표

| 항목 | 값 |
| --- | --- |
| 사이드바 폭 | 380px |
| 사이드바 상단 스페이서 | 61px |
| sticky top | 86px (전역 헤더 66 + 20; 지시서 24px는 헤더 때문에 불가) |
| 지도 높이 | 300px |
| 타임라인 그리드 | 62px / 26px / 1fr, gap 14px |
| 번호 원 | 26px |
| 카드 라운드 | 20px (장소 카드 16px) |
| 시각 표기 | 15px extrabold, tabular-nums |

색·아이콘은 기존 토큰 + `@/components/ui/icon`. 새 아이콘 없음.
쓰는 이름: `check`, `external-link`, `wand`, `alert`, `pin`, `chevron-up`, `chevron-down`, `compass-outline`.

## 하지 말 것

- 지도를 일차 카드 안에 다시 넣지 않는다.
- `route` 없을 때 구간 pill을 직선 근사로 채우지 않는다(헤더 합계만 폴백).
- 시안 예시 데이터를 상수로 옮기지 않는다.
- `adjustments` 배너 문구·스타일 변경 금지.
- API 타입·스토어·훅 시그니처 변경 금지.

## 테스트

- `DayCard.test.tsx` — 첫 item `startTime`이 `출발` 값 / `route` 있으면 구간 pill `items.length - 1`개 / `route: null`이면 0개 / 카드 내 지도 없음
- `PlaceItem.test.tsx` — `startTime`+`endTime` 둘 다면 `머무는 시간` 노출, 한쪽만이면 미노출 (기존 편집 버튼 테스트 유지)
- 신규 `DayTabs.test.tsx` — `days.length === 1`이면 미렌더 / 탭 클릭 시 `onSelect(index)` 호출 / 라벨에 `곳`·거리
- 신규 `DayRouteLegs.test.tsx` — 세그먼트 수만큼 줄 / `route: null`이면 미렌더
- `ItineraryResult.test.tsx` — 개요 지도 미렌더, 선택 일차만 표시, 탭으로 일차 전환
- `ItineraryMap.test.tsx` — 기존 유지 (`variant` 유지되므로 통과), `heightClassName` 스모크

## 완료 조건

```
bun run test
bun run lint
bun run build
```

세 개 다 통과. 작업 후 바뀐 파일 목록 + 판단 지점(라벨 겹침 = 라벨 안 붙임, route 없는 날 = 구간행 생략, sticky top = 86px) 요약.
