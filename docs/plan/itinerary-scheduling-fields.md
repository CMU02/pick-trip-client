# AI 일정 — 백엔드 스케줄링 데이터 프론트 반영 계획

## Context

백엔드(`CMU02/pick-trip-server`)가 AI 일정 기능을 확장했다(커밋 `90210f4`·`226d4bb`·`9b22949`·`ebec4f9`·`7414ac4`·`fb59647`·`62088b2`·`c703413`, 모두 `main` 병합됨). 스케줄러 도메인이 추가되어 **거리·운영시간·휴무일을 검증하고 방문 순서를 자동 재배치**하며, 응답에 다음이 **추가(additive, 필드 삭제·개명 없음)**되었다:

- **장소별 방문 시각** `startTime`/`endTime` (`"HH:mm"` 문자열, nullable)
- **하루 이동 요약** `totalTravelMinutes`/`totalTravelKm` (day 단위, nullable)
- **하루 날짜** `date` (`"yyyy-MM-dd"`, generate 응답 전용)
- **경고 문구** — 장소별 `notes[]`, 하루 `dayNotes[]`, 여정 `adjustments[]` (모두 generate 응답 전용, 저장/조회에는 없음)
- `reason`이 내부 ID·enum 코드 없이 사용자 친화 한국어로 정제됨(nullable 가능)
- 일정이 **바구니 contentId만** 포함 → generate/조회 응답에 **장소 0개인 날**(`items: []`)이 올 수 있음. 단 저장(`POST`/`PATCH`)은 `items` `@NotEmpty` 검증이라 빈 날이 있으면 **요청 전체가 400**.
- 콘텐츠 상세(`GET /contents/{id}`)는 스키마 변경 없으나 `useTime`/`restDate`/`parking` 값이 훨씬 많은 콘텐츠(식당·카페·문화·축제)에 채워짐. 원본에 리터럴 `<br>` 태그가 섞여 옴.

현재 프론트(`src/types/itinerary.ts`, `itineraryService.ts`, `src/app/itinerary/_components/*`)에는 시각·이동·경고를 담을 필드가 **전혀 없고**, `withSyntheticIds`가 generate 응답 item을 필드 단위로 재구성하며 **미지원 필드를 능동적으로 버린다**. 결과 화면에도 시간 컬럼·이동 요약·경고 표시가 없다(플랜 문서에 "데이터 없어 보류"로 기록됨).

목표: 백엔드가 새로 내려주는 데이터를 결과 화면(미리보기·저장됨·공유)에 전면 반영하고, 저장/편집 왕복까지 맞춘다.

## 사용자 결정사항

1. **반영 범위**: 결과 화면 전체 반영 — 방문 시각, 하루 이동 요약, `dayNotes`/`notes` 경고, 상단 `adjustments` 안내 배너, 사이드바 총 이동 요약, 저장 시 시각·이동값 왕복 저장.
2. **편집 시 시각 처리**: 저장된 일정 편집기에서 어떤 날의 장소를 이동/삭제/교체하면 **그 날의** `startTime`/`endTime`/이동값을 `null`로 지운다(손대지 않은 날은 유지). 재계산은 "다시 생성" 몫.
3. **빈 날 저장**: **저장 버튼을 막는다**. 장소 0개인 날이 하나라도 있으면 저장 비활성화 + 안내 문구. (자동 삭제·재번호 안 함.)
4. **콘텐츠 상세 정리**: 이번 작업에 포함 — `<br>` 태그 문자열을 실제 줄바꿈으로 렌더.

## 결정된 세부사항 (구현자 판단 불필요)

- **시각 표기**: 24시간제 `"09:30 – 11:00"` (한쪽만 있으면 그쪽만, 둘 다 없으면 표시 안 함).
- **타입 구조**: 공유 `Day`/`Item` 인터페이스에 **선택 필드로 추가**(별도 `GeneratedDay` 분리 안 함). `adjustments`만 `ItineraryGenerateResponse`에 둬서 저장·공유 응답 타입에는 안 들어가게 한다 → 배너가 자동으로 미리보기에서만 뜬다.
- **매퍼 레이어**: 범용 `to*` 매퍼 신설 안 함. generate 경로만 `withSyntheticIds`에서 명시 매핑. 조회/저장/수정은 `{ ...data }` 그대로(선택 필드라 타입 흐름 성립).
- **정규화**: generate 매퍼는 항상 `null`/`[]`로 정규화(`undefined` 금지) — 테스트 `toEqual` 안정성. 조회 읽기 지점은 `?? []` 방어.
- **아이콘**: `src/components/ui/icon.tsx`의 `FILL_ICON_PATHS`에 `alert` 삼각형 path 1개 추가. 이동 칩은 기존 `compass-outline` 재사용.
- **날짜 파싱**: `new Date("2025-05-03")` 금지(UTC 파싱 → 음수 오프셋 CI에서 하루 밀림). `split("-")` 후 `new Date(y, m-1, d)`로 요일 계산.
- **dayIndex**: 빈 날을 안 지우므로 재번호 문제 없음. 백엔드는 `dayIndex`를 그대로 저장하고 `@OrderBy` 정렬만 함(공백 허용).

## Phase 1 — 데이터 계층 (화면 변화 없음, 독립 배포 가능)

### `src/types/itinerary.ts`

- `Item` += `startTime?: string | null`, `endTime?: string | null`, `notes?: string[]`. L49–50 낡은 주석 삭제.
- `Day` += `date?: string | null`, `totalTravelMinutes?: number | null`, `totalTravelKm?: number | null`, `dayNotes?: string[]`.
- `RawGeneratedItem` += `startTime: string | null`, `endTime: string | null`, `notes: string[]`.
- `RawGeneratedDay` += `date: string | null`, `totalTravelMinutes: number | null`, `totalTravelKm: number | null`, `dayNotes: string[]`.
- `RawItineraryGenerateResponse` + `ItineraryGenerateResponse` += `adjustments: string[]` (필수 — 서버가 항상 보냄, 빈 배열일 수 있음).
- `DayRequest` += `totalTravelMinutes?: number`, `totalTravelKm?: number`.
- `ItemRequest` += `startTime?: string`, `endTime?: string`.
- `Day`/`Item`에 주석: `date`/`dayNotes`/`notes`는 generate(미리보기) 전용, 저장·공유 응답에는 없음.

### `src/services/itineraryService.ts`

- `withSyntheticIds`: 새 필드를 **명시적으로** 이어붙인다(기존에 `pinned: false`·합성 id를 명시 주입하는 방식과 동일).
  - item: `startTime: item.startTime ?? null`, `endTime: item.endTime ?? null`, `notes: item.notes ?? []`
  - day: `date: day.date ?? null`, `totalTravelMinutes: day.totalTravelMinutes ?? null`, `totalTravelKm: day.totalTravelKm ?? null`, `dayNotes: day.dayNotes ?? []`
- `generateItinerary` 반환: `adjustments: data.adjustments ?? []` 명시.
- `getItinerary`/`saveItinerary`/`modifyItinerary`: **변경 없음** — `{ ...data, duration }`가 이동값·시각을 그대로 통과시킴. `date`는 평범한 문자열이라 `duration` ±1 경계와 무관.
- `shareService.ts`: 변경 없음.

### `src/lib/itinerary.ts` — 신규 헬퍼 (+ `itinerary.test.ts`)

현재 이 파일엔 `formatDuration`만 있음. 추가:

- `formatTimeRange(start?: string | null, end?: string | null): string | null` — `"09:30","11:00"` → `"09:30 – 11:00"`; 한쪽 null → 그쪽만; 둘 다 null → `null`.
- `formatTravelMinutes(min?: number | null): string | null` — null/0 → `null`; 45 → `"45분"`; 90 → `"1시간 30분"`; 120 → `"2시간"`.
- `formatDistanceKm(km?: number | null): string | null` — null/0 → `null`; 12.4 → `"12.4km"`; 12 → `"12km"` (소수 1자리).
- `formatDayDate(date?: string | null): string | null` — `"2025-05-03"` → `"5월 3일 (토)"`; `split("-")` → `new Date(y, m-1, d)` → 요일 `["일","월","화","수","목","금","토"][d.getDay()]`.
- `sumDayTravel(days: Day[]): { totalMinutes: number | null; totalKm: number | null }` — 어떤 날도 이동값이 없으면 둘 다 `null`, 아니면 non-null만 합산.
- `hasEmptyDay(days: Day[]): boolean` — `days.some(d => d.items.length === 0)`.
- `toSaveDays(days: Day[]): DayRequest[]` — 저장/수정 요청 body의 `days` 프로젝션. 빈 날은 거르지 않음(버튼에서 차단). item당 `contentId,title,order,reason,pinned:(pinned ?? false),startTime:(startTime ?? undefined),endTime:(endTime ?? undefined)`; day당 `dayIndex,totalTravelMinutes:(?? undefined),totalTravelKm:(?? undefined)`. `?? undefined`로 null을 JSON에서 생략.

모든 포매터는 표시할 게 없으면 `null` 반환 → 호출부는 `{formatX(...) && <chip>…}`.

선택 정리: `formatDuration` 인라인 재구현 3곳(`ItineraryClient.tsx` L39, `share/[id]/page.tsx` L17, `TripSummary.tsx` L44)을 lib export로 교체.

### `src/services/itineraryService.test.ts`

엄격한 `toEqual`. 4개 describe 블록 전부의 `rawServerResponse` + `expectedResult` 갱신:
- generate: raw day/item에 새 필드, raw 응답에 `adjustments`; expected는 `null`/`[]` 정규화된 동일 값.
- save/get/modify: raw + expected day에 `totalTravelMinutes/totalTravelKm`, item에 `startTime/endTime` (통과).

**독립 배포 가능**: 동작 변화 없음, 테스트 green, 이후 표시 작업 잠금 해제.

## Phase 2 — 결과 화면 표시 (읽기 전용 표면, 독립 배포 가능)

### `PlaceItem.tsx` (새 prop 없음)

- 제목 행(`flex flex-wrap items-center gap-1.5`): `{title}` + `formatTimeRange(item.startTime, item.endTime)`가 non-null이면 시각 칩(`shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground`) + 기존 "고정" 배지.
- 기존 `reason` 필 — 그대로(primary 톤, wand 아이콘).
- **신규**: `notes = item.notes ?? []` → 앰버 경고 목록. 각 줄 `flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700` + `alert` 아이콘. **reason 필 다음, 편집 컨트롤 행 앞**. 순서 근거: reason(왜 여기) → notes(시간 주의) → 컨트롤.
- 시각적 위계: reason = 차분한 primary 톤 / notes = 앰버(개장 전 도착·마감 후·휴무일 경고, reason보다 강하되 destructive-red는 아님).

테스트: 시각 칩(양쪽/한쪽/없음), notes 목록, `[]`/undefined면 미표시. `makeItem`은 그대로 컴파일.

### `DayCard.tsx` (새 prop 없음)

- **헤더 1행**: 타일 + "{n}일차" 유지, `day.date` 있으면 `· {formatDayDate(day.date)}` 를 `text-muted-foreground`로 덧붙임. 우측 `{items.length}곳` 유지.
- **헤더 2행(조건부)**: `formatTravelMinutes(day.totalTravelMinutes)` 또는 `formatDistanceKm(day.totalTravelKm)`가 non-null이면 제목 아래 이동 칩 — `이동 {[dur, dist].filter(Boolean).join(" · ")}` + `compass-outline` 아이콘, `text-[12px] text-muted-foreground`.
- **`dayNotes` 스트립(신규)**: `day.dayNotes ?? []` → 헤더와 항목 목록 사이, 카드 안 full-width, `border-b border-border bg-amber-50/60 px-5.5 py-3 space-y-1 text-xs text-amber-700`.
- **빈 날 상태(신규)**: 백엔드가 `items: []`를 내려줄 수 있음 → `divide-y` 본문 대신 `<p className="px-5.5 py-6 text-sm text-muted-foreground">이 날에는 아직 일정이 없어요</p>`.

테스트: 헤더 날짜, 이동 칩 유무, dayNotes 렌더, 빈 날 문구. `makeDay` 그대로.

### `ItineraryResult.tsx`

- prop 확장: `data: { days: Day[]; adjustments?: string[] }`. 모든 호출부가 구조적으로 충족(저장·공유 타입엔 `adjustments` 없음 → 배너 안 뜸). **이게 배너를 미리보기에서만 보이게 하는 메커니즘** — 별도 phase 플래그 불필요.
- **adjustments 패널**: `<h2>` 행 바로 아래, 일자 목록 앞, `adjustments?.length`일 때. `rounded-xl border border-primary/25 bg-primary/5 p-4`, wand 아이콘 + bold primary 헤더 "AI가 일정을 이렇게 조정했어요", `list-disc` + `text-[13px] text-foreground/80`. `phase.error`·`editor.saveError`와 구분(정보성 안내이지 실패 아님).
- **편집기 저장 버튼**: `disabled`에 `hasEmptyDay(editor.days)` 추가. 빈 날 있으면 버튼 아래 `text-sm text-muted-foreground`로 "장소가 없는 날이 있어 저장할 수 없어요. 장소를 추가하거나 다시 생성해보세요."

테스트: `adjustments` 있으면 배너, 없거나 `[]`면 미표시, 편집기 전용 픽스처엔 안 나옴; 빈 날 → 저장 disabled.

### `ItineraryClient.tsx`

- `buildLoginPreviewItinerary`: 반환에 `adjustments: []` 추가. day/item 스케줄 필드는 **없는 채로** 둔다(가짜 데이터의 정직한 "스케줄 없음" 상태, 컴포넌트가 아무것도 안 그림). 플레이스홀더 값 불필요.
- preview·saving 분기: `<TripSummary>`에 `travelSummary={sumDayTravel(phase.data.days)}` 전달. `<ItineraryResult data={phase.data} />` — `phase.data`가 `ItineraryGenerateResponse`라 `adjustments` 자동 포함.
- loginPreview 분기: `travelSummary={null}` (가짜 데이터엔 없음).
- **저장 버튼 게이트**: preview 분기의 "저장" 버튼 `disabled`에 `hasEmptyDay(phase.data.days)` 추가 + 버튼 옆/아래 안내 문구.
- `handleSave` 프로젝션(L378–393) → `toSaveDays(previewData.days)`. 방어적으로 `if (hasEmptyDay(previewData.days)) return;` 선두 가드.
- `SavedItineraryPanel`: 사이드바가 **`<TripSummary>`가 아닌 자체 인라인 `<section>`**. 여기에 `sumDayTravel(editor.days)` 기반 이동 행 추가. `editor.isDirty`면 숫자 대신 muted 문구("일정을 바꿔 이동 시간을 다시 계산해야 해요") — Phase 3와 일관.

### `TripSummary.tsx`

- 선택 prop `travelSummary?: { totalMinutes: number | null; totalKm: number | null } | null` 추가.
- 기간/동행 다음, non-null이고 값 > 0일 때 "총 이동 시간" / "총 이동 거리" 행 렌더. `TripSummary`는 일정 타입을 안 받음(호출부가 precompute; 편집기 경로는 어차피 라이브 재계산 필요).

### `src/app/share/[id]/page.tsx`

- 코드 변경 불필요 — `<ItineraryResult data={data} />`가 새 per-day/per-item 필드를 자동 렌더, `adjustments` 없음 → 배너 없음.
- 선택: 인라인 `formatDurationText` → lib `formatDuration`.
- 배포 전 실제 공유 토큰으로 `/share` 응답에 이동값·시각이 포함되는지 확인(백엔드 조사상 `9b22949`에서 포함됨).

### `src/components/ui/icon.tsx`

- `FILL_ICON_PATHS`에 `alert: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"` 추가.

**독립 배포 가능**: 미리보기·저장됨·공유 전반에 표시 완성.

## Phase 3 — 저장 / 편집 왕복 + 빈 날 가드

### `src/hooks/useItineraryEditor.ts`

- 모듈 함수 `clearDaySchedule(day: Day): Day` — `totalTravelMinutes: null`, `totalTravelKm: null`, `items`의 각 `startTime: null`, `endTime: null`.
- `moveItem`·`removeItem`·`replaceItem`: 기존 `day.dayId === dayId ? … : day` 분기에서 만든 날을 `clearDaySchedule(...)`로 감싼다.
- `togglePinned`: 시각 유지(핀은 현재 서버 모델상 아무것도 안 옮김).
- `save()`: 프로젝션 → `toSaveDays(days)`. 선두 가드 `if (hasEmptyDay(days)) { setSaveError(<합성 메시지>); return; }`.
- 반환에 `hasEmptyDay: hasEmptyDay(days)` 노출(또는 소비처에서 lib로 계산) → `ItineraryResult` 저장 버튼 disable에 사용.
- `save` 성공 시 `setDays(saved.days)` — 서버가 보낸 대로 에코, 일관 유지.

### 테스트

- `useItineraryEditor.test.ts`: `moveItem`/`removeItem`/`replaceItem` 후 편집한 날의 `totalTravel*` null, 그 날 items 시각 null; 손대지 않은 날 유지; `save` 요청이 시각·이동값 포함(스케줄된 날), 빈 날 가드.
- `itineraryService.test.ts`: save/modify 요청 픽스처를 프로젝션 형태로 갱신.
- `ItineraryClient.test.tsx`: `handleSave`가 `toSaveDays` 형태 생성; 빈 날이면 저장 버튼 disabled.
- `itinerary.test.ts`: `toSaveDays`, `sumDayTravel`, `hasEmptyDay`, 포매터 전부(고정 날짜→요일 케이스 포함).

**독립 배포 가능**.

## Phase 4 — 콘텐츠 상세 정리 (Phase 1–3와 독립)

### `src/app/contents/[id]/_components/ContentDetailView.tsx`

- `InfoRow`가 `{value}`를 평문 렌더 → `useTime`/`restDate`에 리터럴 `<br>`이 섞여 옴. `value`를 `/<br\s*\/?>/i`로 split 해 각 줄을 실제 `<br />`로 구분 렌더(React `Fragment` map). **`dangerouslySetInnerHTML` 금지.**
- `InfoRow`는 `flex items-center justify-between` + `text-right` — 여러 줄 값은 `items-start` + 좌측 정렬 wrap 필요. 소폭 레이아웃 조정.
- 새 필드 없음. 식당·카페·문화·축제에서 "정보 없음"이 크게 줄어듦.
- 헬퍼는 `src/lib/content.ts`에 `splitBrLines(text: string): string[]` 또는 컴포넌트 인라인.

테스트: `ContentDetailView.test.tsx` — 운영시간에 `<br>` → 여러 줄; `null` → "정보 없음".

**독립 배포 가능** — 일정 작업 전/후 아무 때나.

## 리스크

1. **엄격한 `toEqual` 서비스 테스트** — `itineraryService.test.ts`가 전체 객체 비교. 4개 describe의 모든 raw/expected가 새 필드를 `null`/`[]`(not `undefined`)로 얻어야 함. 가장 큰 변경 지점.
2. **컴포넌트 테스트 픽스처** — 새 필드가 **선택**이라 그대로 컴파일. 필수로 만들지 말 것.
3. **`undefined` vs `null` vs 부재** — generate 매퍼는 `null`/`[]` 정규화, 조회 읽기 지점은 `?? []` 방어. 혼용 시 flaky diff.
4. **`date` 타임존** — 요일 계산에 `new Date("2025-05-03")` 금지. `split("-")` 지역 파츠 생성. 고정 날짜→요일 테스트 추가.
5. **저장 응답에 `notes`/`dayNotes`/`adjustments` 부재** — bare `.map` on `undefined` throw. 모든 읽기 지점(`PlaceItem`·`DayCard`·`ItineraryResult`)이 `?? []` 사용.
6. **`ItineraryResult` prop 확장** — `data: { days: Day[]; adjustments?: string[] }` — 세 응답 타입 모두 할당 가능(저장·공유는 `adjustments` 없음, optional). `SavedItineraryPanel`·share·preview/loginPreview 호출부 확인.
7. **사이드바 코드 경로 2개** — `SavedItineraryPanel`은 자체 인라인 `<section>`, preview/loginPreview는 `<TripSummary>`. 이동 요약을 **양쪽** 다 추가해야 함.
8. **편집 staleness UX** — 편집한 날 시각이 조용히 사라짐. 저장 사이드바의 dirty 문구로 완화.
9. **`replaceItem`이 이미 `reason` null 처리** — 이제 `clearDaySchedule`로 날 스케줄도 null. 둘 다 검증하는 테스트 추가.
10. **공유 응답 완전성** — `/share`가 이동값·시각을 반환한다고 가정. 라이브 토큰으로 확인 후 배포.
11. **`formatDistanceKm(0)` / 단일 정차 날** — `0` → `null` 반환해 칩 숨김(“0km” 아님).
12. **loginPreview 빈 날** — `buildLoginPreviewItinerary`가 항상 `nights+1`일을 round-robin으로 채움. 새 빈 날 문구로 trailing 날에 "이 날에는 아직 일정이 없어요"가 뜰 수 있음(허용).

## 검증

```bash
bun run lint && bunx tsc --noEmit && bun run test && bun run build
```

브라우저(백엔드 `localhost:8080` 실행 중, Chrome 세션은 A-MAN으로 로그인됨):

1. 바구니에 3~4곳 담고 여행 조건 설정 → `/itinerary`에서 실제 생성.
2. 결과 화면 확인: 장소별 시각 칩, DayCard 날짜 + 이동 칩, `dayNotes`/`notes` 앰버 경고, 상단 `adjustments` 배너, 사이드바 총 이동 요약.
3. 저장 → 저장됨 패널에서 시각·이동값 유지 확인.
4. 한 날의 장소를 위/아래 이동 → 그 날 시각·이동값만 사라지고 다른 날은 유지 확인. 저장 → PATCH 요청 body 확인(cleared 날은 시각 생략).
5. 바구니 장소 < 날짜 수로 생성해 빈 날 유도 → 저장 버튼 비활성 + 안내 문구 확인.
6. 공유 링크 생성 → `/share/[token]`에서 시각·이동 요약 렌더, `adjustments` 배너 없음 확인.
7. 운영시간에 `<br>` 있는 콘텐츠(식당) 상세 → 여러 줄 렌더 확인.

## 브랜치 / 워크플로

- `main`에서 새 브랜치(예: `feat/itinerary-scheduling-fields`). 이슈는 만들지 않음(이번 세션 패턴).
- 계획 문서는 `docs/plan/itinerary-scheduling-fields.md`로 레포에 커밋(프로젝트 컨벤션).
- Phase 1 → 2 → 3 순으로 커밋. Phase 4는 별도 커밋(독립). 각 Phase 끝에 lint/tsc/test/build.
- 현재 로컬 미푸시 브랜치: `fix/103`, `fix/region-content-counts`, `fix/explore-initial-page-size`. 이 작업은 그것들과 무관하게 `main` 기준.
