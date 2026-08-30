# AI 일정 결과 화면 — 시안 미반영분 마감 (v2)

- 이슈: CMU02/pick-trip-client#114
- 브랜치: `fix/114` (base main = 2294b11)
- 시안: `AI 일정 결과 리디자인.dc.html`
- 선행: `docs/plan/itinerary-result-redesign.md` (#111, main 병합됨)

데이터 계약(API 타입·스토어·훅) 변경 없음. 있는 값만 재배치·재스타일.

## A. `DayRouteLegs` 코랄 폰트

`{i+1}→{i+2}` span: `text-foreground/70` → `text-primary`, `w-[34px]` 고정, `font-extrabold`.
우측 거리값: `text-muted-foreground` → `text-foreground/80` (시안 `oklch(0.28)`), `font-bold`.
가운데 `from → to`: `text-[12px] text-muted-foreground` 유지.

## B. 높이 맞춤 — `DayMapPanel`

시안: 지도가 카드 상단 경계에 flush(패딩 0, `overflow-hidden`), 구간 영역만 자체 패딩.
현재: `<section p-3.5>` 로 지도가 14px 안쪽 → `DayCard`(헤더가 상단 flush)와 시작선 어긋남.

- 외곽 `<section rounded-[20px] border bg-card>` 에서 `p-3.5` 제거, `overflow-hidden` 추가.
- 지도: 바깥 `<div rounded-[14px]>` 래퍼 제거, `ItineraryMap`을 패널 상단에 직접(모서리는 패널 `overflow-hidden`이 자름).
- 구간 영역: 별도 `<div className="p-4">` 로 감싸 그 안에 헤더행 + `DayRouteLegs` + 링크.
- 61px 스페이서·`lg:top-[86px]`는 그대로(전역 헤더 때문).

## C. 지도 마커 장소명 라벨 + 겹침 처리 — `ItineraryMap`

`variant="day"` 에서만 라벨을 붙인다. `variant="overview"`(미사용)는 지금대로 번호만.

- 마커 원 `22px → 26px`, `variant="day"` 색은 코랄(`oklch(0.6 0.19 28)`) 고정
  (한 날만 보므로 일차색 순환 불필요). `overview`는 `dayColor` 유지.
- 마커 옆 라벨: `markerHtml`에 라벨 span 추가 —
  `max-width:132px; padding:3px 8px; border-radius:7px; background:#fff(0.94);
   border:1px solid oklch(0.91 0.012 30); font:700 11px; white-space:nowrap;
   overflow:hidden; text-overflow:ellipsis;`
- 방향: 마커의 지도 화면좌표 x가 컨테이너 폭의 55% 초과면 `flex-direction:row-reverse`
  (라벨을 마커 왼쪽). 화면좌표는 `map.getProjection()` 또는 마커 픽셀 추정 —
  간단히 `LatLngBounds` 대비 경도 위치로 근사(`(lng-minLng)/(maxLng-minLng) > 0.55`).
- 겹침: 앞선 마커와 위경도→미터 거리(`haversineKm`)가 화면 축척상 가까우면 라벨 숨김.
  화면 픽셀 대신, 같은 날 점들의 bbox 대각선 대비 상대거리 `< 0.18` 이면 숨기고 번호만.
  (시안의 96px 픽셀 규칙을 지도 데이터로 근사 — 정확한 픽셀은 지도 이동/줌마다 바뀌어 불안정)
- 폴리라인: `variant="day"` 코랄, `strokeWeight 4 → 5`.
- `heightClassName` 은 이미 있음(#111). `DayMapPanel`이 `h-[300px]` 주입 — 유지.

## D. 이동 pill / 구간 목록 스타일

### `DayCard` 타임라인 leg pill
현재: `bg-muted rounded-full px-2.5 py-1 text-[12px] text-muted-foreground`.
시안: `border border-border bg-[oklch(0.985_0.008_30)] rounded-full px-3 py-1.5
       text-[12px] font-bold text-[oklch(0.4_0.015_30)]` + compass 아이콘.
→ 클래스만 교체. "차로 {분} · {km}" 텍스트 유지. 도로명은 데이터 없음 → 자리 안 만듦.

### `DayMapPanel` 구간 영역 헤더행 (신규)
`DayRouteLegs` 위에:
`<div className="flex items-center justify-between text-[12.5px]">
   <span className="text-muted-foreground">{n}일차 구간</span>
   <span className="font-extrabold">{travelLabel}</span></div>`
- `travelLabel` = route 있으면 `분 · km` 합계, 없으면 `day.totalTravel*` 폴백
  (`DayCard`의 `travelLabel` 계산 로직과 동일 — `lib/itinerary`에 헬퍼로 뽑아 공유).
- route/합계 둘 다 없으면 헤더행 생략.

### "카카오맵에서 경로 열기" 링크
`py-2.5` → `min-h-[44px]`, `rounded-[12px]` 유지, `text-[13px] font-bold`.

## E1. `DayCard` 헤더

- 날짜: 제목 인라인 `<span>` → 제목 **아래 줄** `<p className="mt-0.5 text-[12.5px] text-muted-foreground">`.
- 우측 3값: label `text-[11px]`, value `text-[13px] font-bold` → value `text-[15px] font-extrabold tracking-[-0.02em]`.
- 우측 컬럼 간격 `gap-5` → `gap-[22px]`.

## E2. `DayCard` notes → 헤더 안 pill

현재: 헤더 아래 `<ul>` full-width 스트립(`border-b bg-amber-50/60`).
시안: 헤더 div 안, 우측 값 행 아래 `mt-3.5`. 각 note가 개별 pill:
`flex items-start gap-1.5 rounded-[11px] bg-[oklch(0.975_0.035_85)] px-3 py-2
 text-[12.5px] leading-relaxed text-[oklch(0.45_0.09_70)]` + `Icon alert` (같은 색).
→ notes `<ul>`을 헤더 div 안으로 이동, 스타일 교체, `border-b` 스트립 제거.

## E3. 장소 카드 title — `PlaceItem`

`<p className="font-semibold text-foreground">` → `text-[15.5px] font-bold tracking-[-0.025em]`.

## E4. 타임라인 하단 안내문 — `ItineraryResult`

`DayCard` 아래(지도 패널 위, 레이아웃 안에서는 지도 패널이 없으니 DayCard 바로 아래):
`<p className="mt-3.5 px-0.5 text-[12px] leading-relaxed text-muted-foreground">
  이동 시간·거리는 카카오 모빌리티 자동차 길찾기 실제 도로 기준입니다. 순서를 바꾸면 다시 계산돼요.</p>`
- `route`가 잡힌 날이 하나도 없으면(구간값 자체가 없음) 생략.

## E5. 액션 버튼 — `ItineraryClient`

시안 버튼: `min-h-[44px] rounded-[12px] text-[14px] font-bold`, 저장=코랄 채움,
공유/다시생성=아웃라인, 공유에 `Icon external-link`.

**로그인 전/후 구분** (feat/111이 이미 phase별로 다른 actions 세트를 넘김):

| phase | 액션 세트 |
| --- | --- |
| `preview`/`saving` (로그인 후, 미저장) | `[저장][다시 생성]` — 저장 클릭 시 제목 입력 폼 |
| `loginPreview` (로그인 전) | `[로그인하고 계속하기][다시 생성]` — 공유·저장 없음 |
| `saved` (저장 완료) | `<ShareButton>` (공유 링크 박스) — 기존 유지 |

- 공용 버튼 스타일을 `Button`으로 커스텀하거나(현재 `Button` size별 높이 확인),
  각 호출부 `className`으로 `min-h-[44px] rounded-[12px]` 주입.
- `loginPreview`에는 공유 버튼을 넣지 않는다(저장 전이라 itineraryId 없음 — 기존 제약).
- "다시 생성"은 세 phase 공통 스타일.

## 아키텍처 유의

- `ItineraryResult`는 레이아웃 밖(`share/[id]`, 저장 목록 펼침)에서도 쓰인다.
  - E4 안내문: `ItineraryResult` 안에 두면 양쪽 다 노출됨 — OK(공유 페이지도 실도로 기준 안내가 맞음).
  - `hideMap` 분기 유지.
- `DayMapPanel`은 레이아웃 사이드바 + `ItineraryResult` 단독(`!hideMap`) 양쪽에서 렌더 → B·D 변경이 둘 다 반영됨.

## 테스트

- `DayRouteLegs.test.tsx` — `1→2` 텍스트에 `text-primary` 클래스 (또는 존재만 유지) / route null 미렌더 (기존)
- `DayCard.test.tsx` — 날짜가 별도 줄 / notes가 헤더 안 / leg pill 텍스트 (기존 개수 검증 유지)
- `PlaceItem.test.tsx` — title 텍스트/역할 기준이라 유지, 머무는 시간 기존
- `ItineraryMap.test.tsx` — `variant="day"` 라벨(장소명) 노출 / `variant="overview"` 번호만 / 겹침 시 라벨 숨김 스모크 / `heightClassName`
- `DayMapPanel` — 신규 `DayMapPanel.test.tsx`: 구간 헤더행(`{n}일차 구간` + 합계), 지도 flush(스냅샷 대신 클래스), 링크
- `ItineraryResult.test.tsx` — E4 안내문 노출(route 있는 fixture) / route 없으면 미노출
- `ItineraryClient.test.tsx` — loginPreview에 공유 버튼 없음 / preview에 저장 버튼 (기존 + 스타일 무관)

## 검증

```bash
bun run test
bun run lint
bun run build
```

`bun run dev` 로그인 후 생성 → 결과 화면: 지도-카드 상단 정렬, 마커 라벨, 코랄 순번,
구간 헤더행, 날짜 줄, notes pill, 안내문. 로그인 전(AUTH_REQUIRED 폴백)에서 공유 버튼 없음.
