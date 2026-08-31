# AI 일정 화면 폴리시 — 폭 통일 · 타임라인/요약 보강 · 상단 정렬 (v3)

- 이슈: CMU02/pick-trip-client#(발급 예정)
- 브랜치: `feat/<이슈번호>` (base main)
- 선행: `docs/plan/itinerary-result-redesign-polish-v2.md` (#114, main 병합됨)

데이터 계약(API 타입·서비스) 변경 없음. 있는 값만 재배치·재스타일 + prop 추가.

## 배경 (사용자 피드백)

1. 생성 전 화면(`PreGenerateView`)과 결과 화면의 컨테이너 폭이 다르다 — 생성 전은
   `max-w-[1180px]`, 결과는 `max-w-7xl`(1280px). 사이드바 컬럼 폭도 340 vs 380으로 다르다.
2. 생성 전 화면의 "담은 콘텐츠" 섹션이 콘텐츠가 많아지면 세로로 너무 길어져
   레이아웃이 늘어진다 → 내부 스크롤로 높이를 제한한다.
3. 타임라인 시각 열이 백엔드가 방문 시각을 안 줄 때 빈 여백으로 보인다 → 항상
   의미 있게 유지한다.
4. "머무는 시간"이 평문이라 눈에 안 띈다 → pill로 강조한다.
5. 여행 요약이 빈약하다 → 일정 규모·하루 평균·총 머무는 시간 행을 더한다.
6. "AI가 일정을 이렇게 조정했어요" 블록이 일차 탭과 1일차 카드 사이에 들어가면
   왼쪽 카드만 밀려 오른쪽 지도와 상단선이 어긋난다 → 조정/안내 배너를 2열 그리드
   위 전체 폭으로 올리고, 지도 위 스페이서를 실제 탭 행 높이에 맞춘다.

범위 밖: "출발 시간 적기"(입력/표시 강화)는 이번에 하지 않는다(사용자 보류).

## A. 컨테이너 폭 1280px 통일

### `PreGenerateView`
- 최상위 래퍼 `mx-auto w-full max-w-[1180px] px-1` → `w-full`
  (폭·좌우 여백은 `itinerary/page.tsx`의 `max-w-7xl px-4 py-8`가 담당 — 결과 화면과 동일).
- 2열 그리드 `lg:grid-cols-[1fr_340px]` → `lg:grid-cols-[minmax(0,1fr)_380px]`
  (결과 화면 `ItineraryResultLayout`과 동일).
- 히어로 우측 통계 `dl`의 `lg:w-[330px]` → `lg:w-[360px]`.

### 확인만
- `itinerary/page.tsx`는 그대로(`max-w-7xl`). 결과 화면은 이미 이 폭.

## B. "여행 바구니" 패널 높이 제한 — `BasketPanel`

사용자 확인 결과 "여행바구니 길이"는 콘텐츠 담기(`/contents`) 단계의 데스크톱
`BasketPanel`(제목 "여행 바구니")을 뜻한다. `sticky top-[86px]`인데 항목 `<ul>`에
높이 제한이 없어, 담은 콘텐츠가 많으면 패널 전체가 뷰포트를 넘어 하단 "AI 일정
생성" 버튼이 화면 밖으로 밀린다.

- 패널 외곽 `<div>`를 `flex max-h-[calc(100vh-7rem)] flex-col`로.
- 헤더 행·하단 버튼 블록에 `shrink-0`.
- 항목 `<ul>`에 `min-h-0 overflow-y-auto` (flex-1 없이) — 항목이 적으면 자연 높이,
  많으면 목록만 내부 스크롤하고 헤더·버튼은 항상 노출.
- `PreGenerateView`의 "담은 콘텐츠" 섹션은 sticky도 아니고 하단 버튼도 없어
  손대지 않는다(폭 통일만).

## C. 타임라인 시각 열 항상 유지 + 머무는 시간 강조 — `PlaceItem`

- 1열(시각, `62px`): 이미 그리드에 항상 존재. `startTime`이 없을 때 열이 비어
  보이던 것 보정 —
  - `startTime` 있음: 기존대로 시작(코랄 볼드) / 종료(뮤트) 유지.
  - `startTime` 없음: 뮤트된 `·` placeholder 1줄(`text-muted-foreground/50`).
  - 셀에 `min-h-[2.5rem]`을 줘 행 높이가 시각 유무와 무관하게 일정하게.
- "머무는 시간": 제목 아래 평문 `text-[12px] text-muted-foreground` →
  `inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5
   text-[11.5px] font-semibold text-foreground/70` + `Icon name="clock"`(없으면
   기존 아이콘 세트 확인 후 대체, 예: `calendar`/`compass-outline`).
  - `stay`(startTime·endTime 둘 다 있을 때만) 없으면 미표시 — 현행 유지.

## D. 여행 요약 보강 — `TripSummary`

`TripSummary`에 선택적 `days?: Day[]` prop 추가(호출부가 `phase.data.days` / `editor.days` 전달).
`days`가 오면 아래 파생값 계산해 행 추가:

- **일정 규모**: `{duration+1}일 · 총 {totalPlaces}곳` (한 행, 값 우측).
- **하루 평균**: `약 {round(totalPlaces / (duration+1))}곳`.
- **총 머무는 시간**: 모든 item의 `stayMinutes(startTime,endTime)` 합 → `formatTravelMinutes`.
  하나도 계산 안 되면 행 생략.
- 기존 총 이동 시간/거리/출발 시각 행은 유지. 행 순서: 지역·날짜·기간·동행 →
  출발 시각 → **일정 규모 · 하루 평균 · 총 머무는 시간** → 총 이동 시간·거리 → 담은 콘텐츠.
- `stayMinutes` 헬퍼는 현재 `PlaceItem` 내부에 있음 → `lib/itinerary.ts`로 승격해
  `TripSummary`·`PlaceItem` 공유(`stayMinutes(start?, end?): number | null`).

### `SavedItineraryPanel` 인라인 요약 통합
- `ItineraryClient`의 `SavedItineraryPanel`이 직접 만든 사이드바 `<section>`(여행 요약
  중복 구현)을 `TripSummary` 재사용으로 교체:
  - `regions={[data.region]}`, `startDate={data.travelDate}`,
    `nights={data.duration}`, `companions={[]}`, `items={[]}`,
    `showItemList={false}`, `itemCount={총 장소 수}`,
    `days={editor.days}`,
    `travelSummary={editor.isDirty ? null : sumDayTravel(editor.days)}`,
    `departureTime={editor.days[0]?.items[0]?.startTime ?? null}`.
  - 편집 중(`editor.isDirty`) 안내문("일정을 바꿔 이동 시간을 다시 계산해야 해요")은
    `TripSummary` 아래 별도 `<p>`로 유지하거나 생략(테스트 확인 후 결정).

## E. 상단 정렬 — `ItineraryResultLayout` / `ItineraryResult`

### E1. 조정/안내 배너를 그리드 위로
- `ItineraryResultLayout`에 `banner?: ReactNode` prop 추가 — 헤더(제목/액션)와
  2열 그리드 사이에 전체 폭으로 렌더(`{banner && <div className="mt-5">{banner}</div>}`).
- "AI가 일정을 이렇게 조정했어요" 마크업을 `ItineraryResult`에서 분리 →
  신규 `AdjustmentsNotice.tsx`(`{ adjustments: string[] }`, 빈 배열이면 null).
- `ItineraryResult`에 `hideAdjustments?: boolean` 추가. layout 경유 호출은 `true`,
  대신 layout `banner`가 `<AdjustmentsNotice>`를 렌더. 단독(share·저장목록)은 기존대로
  `ItineraryResult` 내부에서 렌더(해당 응답엔 adjustments 없음 → 영향 없음).
- `ItineraryClient`의 각 phase가 children 렌더 함수에서 ItineraryResult 앞에 두던
  `<p>` 안내들(preview 오류, `blockedByEmptyDay`, loginPreview "예시" 배너,
  saved "일정이 저장되었습니다")을 `banner`로 이동. children은 `<ItineraryResult hideAdjustments .../>`만.

### E2. 지도 위 스페이서 정확화
- `ItineraryResultLayout` 오른쪽 `<aside>`의 `<div aria-hidden className="hidden h-[61px] lg:block" />`를
  **왼쪽 pre-card 블록의 실제 미러**로 교체:
  ```
  <div aria-hidden="true" className="hidden lg:block">
    <div className="invisible flex min-h-[45px] flex-wrap items-center gap-3">
      <DayTabs days={days} mapDaysByIndex={mapDaysByIndex}
               selectedIndex={safeIndex} onSelect={() => {}} />
    </div>
    <div className="h-4" />
  </div>
  ```
- `mapDaysByIndex`는 layout의 `mapData` prop에서 계산
  (`new Map(mapData.days.map(d => [d.dayIndex, d]))`).
- 단일 일차(당일치기)면 `DayTabs`가 null → 양쪽 다 `min-h-[45px]`만 → 자동 정합.
- `lg:top-[86px]` sticky offset은 그대로(전역 헤더).

## 파일 변경 요약

| 파일 | 변경 |
| --- | --- |
| `src/app/itinerary/_components/PreGenerateView.tsx` | A(폭), B(스크롤) |
| `src/app/itinerary/_components/PlaceItem.tsx` | C(시각 열·머무는 시간 pill), `stayMinutes` import |
| `src/app/itinerary/_components/TripSummary.tsx` | D(요약 행 추가, `days` prop) |
| `src/app/itinerary/_components/AdjustmentsNotice.tsx` | 신규(E1) |
| `src/app/itinerary/_components/ItineraryResult.tsx` | E1(`hideAdjustments`, 분리) |
| `src/app/itinerary/_components/ItineraryClient.tsx` | E1(banner), E2(스페이서 미러), D(SavedItineraryPanel 통합) |
| `src/lib/itinerary.ts` | `stayMinutes` 헬퍼 승격 |

## 테스트

- `lib/itinerary.test.ts` — `stayMinutes` 신규(정상/한쪽 없음/역전/NaN).
- `PlaceItem.test.tsx` — 시각 없을 때 placeholder 유지·행 렌더(기존 "머무는 시간" 문구 유지),
  머무는 시간 pill 텍스트.
- `TripSummary.test.tsx` — `days` 전달 시 "일정 규모"·"하루 평균"·"총 머무는 시간" 행,
  `days` 없으면 미표시(기존 케이스 회귀).
- `ItineraryResult.test.tsx` — `hideAdjustments`면 배너 미렌더 / 기본은 렌더(기존 유지),
  standalone 탭·안내문 기존 유지.
- `AdjustmentsNotice.test.tsx` — 신규: 항목 렌더 / 빈 배열 null.
- `ItineraryClient.test.tsx` — 조정 배너가 그리드 위(banner)로 이동해도 문구 노출,
  loginPreview "예시"·saved "저장되었습니다" 문구 유지, 탭 전환 유지.
- `PreGenerateView.test.tsx` — 담은 콘텐츠 스크롤 컨테이너 존재(스모크), 폭 클래스는
  스냅샷 아님(테스트 생략 가능).

## 검증

```bash
bun run test
bun run lint
bun run build
bun run dev   # 로그인 후 생성 → 결과: 지도-카드 상단 정렬, 조정 배너 전체폭,
              # 시각 없는 타임라인도 열 유지, 요약 신규 행, 생성 전/후 폭 동일
```
