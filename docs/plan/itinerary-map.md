# 일정 지도 (Kakao Maps) 기능 계획

## Context

사용자가 `.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_API_KEY`(Kakao JS 키)를 추가했다. 이 키로 **일정 결과 화면에 지도**를 붙여, 생성된 일정의 각 콘텐츠 위치와 콘텐츠 간 이동 거리·경로를 눈으로 파악하게 하려는 것이 목표다. 저장한 일정을 다시 볼 때도 지도가 함께 보여야 하고, 공개 공유 페이지(`/share/[id]`)에도 지도가 나와야 한다.

현재 상태에서 확인된 제약:

- 일정 응답(`generate`/저장/조회/공유)의 `Item`에는 **좌표가 없다**. `contentId`만 있다.
- 하지만 백엔드 `GET /api/v1/contents`·`GET /api/v1/contents/{id}` 응답에는 `latitude`/`longitude`가 **이미 들어있다**(TourAPI `mapy`/`mapx`, 빈 값이면 `0.0`). 클라이언트가 이 필드를 매핑하지 않고 버리고 있을 뿐이다. 다건 조회 엔드포인트는 없다.
- 저장한 일정은 브라우저 `localStorage`에 요약 포인터만 두고(`pick-trip-saved-itineraries`), 볼 때 백엔드에서 전체를 다시 받아 `ItineraryResult`로 렌더한다. 공유 페이지는 서버 컴포넌트다.
- `next.config.ts`의 CSP가 전 라우트에 `default-src 'self'` 수준으로 엄격해 Kakao SDK(`dapi.kakao.com`)·타일(`*.daumcdn.net`)을 전부 차단한다. 레포에 `next/script` 사용처가 아직 없다.
- React Compiler가 켜져 있다.

### 사용자 결정사항 (질문/답변)

1. **지도 배치**: 상단 전체 지도 + 각 일차 카드 안 지도, **둘 다**.
2. **거리 표현**: Kakao 길찾기(Mobility Directions) REST API로 **실제 도로 거리·시간** + 도로 모양 경로선.
3. **"지도도 함께 저장"**: 저장 시점 스냅샷.
   - ⚠️ **대체 구현 필요 (사용자 확인 요망)**: Kakao 타일은 CORS 헤더가 없어 canvas가 오염되고 `toDataURL()`이 실패한다. Kakao는 서버 정적지도 이미지 URL API도 제공하지 않는다. 따라서 **이미지 스냅샷은 불가**. 대신 **상태 스냅샷** — 저장 시점의 좌표 + 길찾기 결과(경로 geometry·거리·시간)를 `localStorage`에 담고, 저장된 일정을 볼 때 그 데이터로 라이브 지도를 즉시 다시 그린다(콘텐츠 재조회·길찾기 재호출 없음).
4. **공유 페이지**: 지도 표시 O. 서버에서 좌표·길찾기를 미리 풀어 클라이언트 지도 island에 props로 전달.

### 확인 후 진행이 필요한 항목 (AGENTS.md)

- **CSP(= Next.js 설정) 변경**: "브라우저 리소스 전부 same-origin, 외부 CDN 없음" 방침에서 Kakao/Daum CDN을 script/style/img-src에 예외로 연다.
- 새 **서버 전용 환경변수** `KAKAO_REST_API_KEY` 추가(길찾기 REST 키, `NEXT_PUBLIC_` 아님).
- **런타임 의존성 추가 없음** (SDK는 CDN 로드, 타입은 직접 작성).

### 브랜치

`main` 기준 새 브랜치 `feat/itinerary-map`. 현재 `feat/itinerary-scheduling-fields`(미머지 로컬 작업)와 **독립** — 지도는 `contentId`만 필요하고 스케줄링 필드와 무관하다. 계획 문서는 `docs/plan/itinerary-map.md`로 커밋(프로젝트 컨벤션).

---

## 아키텍처 요약

```
Item.contentId ──► useContentCoordinates (N× GET /contents/{id}, React Query 캐시)
                     └─► coords: Map<contentId, LatLng|null>   (0/0·해외 좌표는 geo 필터로 제거)
                          └─► useItineraryRoutes (일차별 POST /api/directions)
                               └─► ItineraryMapData { days: [{ dayIndex, points[], route|null }] }

ItineraryMapData ──► <ItineraryResult mapData?> ──► <ItineraryMap variant="overview">  (전체)
                                              └──► <DayCard mapDay?> ─► <ItineraryMap variant="day">  (일차별)

브라우저 ──POST /api/directions {points[]}──► Route Handler ──KakaoAK──► apis-navi.kakaomobility.com
  (REST 키는 서버에만, connect-src는 dapi.kakao.com만 추가)

저장 시:  handleSave.onSuccess ─► toSnapshot(mapData) ─► itineraryMapSnapshotStore (localStorage "pick-trip-itinerary-maps")
저장 조회: SavedItinerariesList ─► fromSnapshot(snapshot) ─► <ItineraryResult mapData>   (스냅샷 없으면 라이브 폴백)
공유:     share/[id]/page.tsx (서버) ─► resolveMapData(days) ─► <ItineraryResult mapData>
```

핵심 원칙: **`ItineraryResult`가 지도 데이터의 유일한 통로.** `mapData` prop을 주면 그대로 쓰고, 없으면 내부 `useItineraryMapData(days)`로 라이브 해석 → 기존 호출부(공유·저장목록)가 수정 없이도 동작.

---

## 새로 만드는 파일

| 파일 | 역할 |
|---|---|
| `src/types/map.ts` | `LatLng`, `RoutePoint`, `RouteResult`, `ItineraryMapDay`, `ItineraryMapData`, `ItineraryMapSnapshot`, 요청/응답 body 타입 |
| `src/types/kakao.d.ts` | 우리가 쓰는 것만 담은 최소 `kakao.maps` 전역 선언 (~40줄) |
| `src/lib/kakaoMap.ts` | `KAKAO_MAP_JS_KEY` 상수 (`src/lib/site.ts` 패턴) |
| `src/lib/kakaoMapLoader.ts` | SDK 모듈 싱글턴 로더 — `loadKakaoMaps(): Promise<void>`, `autoload=false` + `kakao.maps.load` |
| `src/lib/geo.ts` | `isValidKoreaCoord`(0/0·해외·NaN 거부), `toLatLng`, `haversineKm` — 순수, 단위테스트 |
| `src/lib/kakaoDirections.ts` | `server-only`. `fetchKakaoDirections(points)` + 순수 `normalizeKakaoDirections(raw)`. 웨이포인트 ~30개 초과 시 chunk-and-stitch. Route Handler·공유 페이지 SSR 양쪽에서 사용 |
| `src/lib/itineraryMapSnapshot.ts` | 순수 `toSnapshot(mapData)` / `fromSnapshot(snapshot)` (좌표 5자리 반올림, `v:1` 가드) |
| `src/hooks/useKakaoMap.ts` | `{ status: "loading"|"ready"|"error" }` |
| `src/hooks/useContentCoordinates.ts` | `useQueries`로 dedupe된 contentId → `getContentById`, `coords: Map<id, LatLng|null>` |
| `src/hooks/useItineraryRoute.ts` | 일차별 `getDirections(points)` `useQueries`, `Map<dayIndex, RouteResult|null>` |
| `src/hooks/useItineraryMapData.ts` | 위 두 훅 조합 → `ItineraryMapData` |
| `src/hooks/useItineraryMapSnapshots.ts` | 스냅샷 스토어 hydrate + orphan prune (`useSavedItineraries` 패턴) |
| `src/services/directionsService.ts` | 클라이언트 `getDirections(points)` → `POST /api/directions` (fetch, apiClient 아님) |
| `src/stores/itineraryMapSnapshotStore.ts` | zustand + 수동 localStorage, `{ [itineraryId]: ItineraryMapSnapshot }`, `MAX_ENTRIES=20`, quota 시 오래된 절반 폐기 |
| `src/app/api/directions/route.ts` | POST Route Handler. body 검증(2~60개, 한국 좌표) → `fetchKakaoDirections` → `{ok,route}` / `{ok:false}` |
| `src/app/itinerary/_components/ItineraryMap.tsx` | `"use client"`. `variant: "overview"|"day"`. 컨테이너 ref + 지도/오버레이 ref, effect로 init/데이터동기화/relayout/cleanup |

## 수정하는 파일

| 파일 | 변경 |
|---|---|
| `src/types/content.ts` | `ContentDetail`에 `latitude: number; longitude: number;` 추가 |
| `src/services/contentService.ts` | `RawContentDetail`에 `latitude`/`longitude`, `toContentDetail` passthrough 매핑 |
| `src/services/contentService.test.ts` | `getContentById` 픽스처·기대값에 좌표 추가 + `0,0` passthrough 케이스 (엄격 `toEqual`) |
| `next.config.ts` | CSP에 Kakao 호스트 추가(아래), same-origin 주석 블록 갱신 |
| `src/app/itinerary/_components/ItineraryResult.tsx` | `mapData?: ItineraryMapData` prop. 없으면 내부 `useItineraryMapData(days)`. adjustments 블록과 일자 목록 사이에 `<ItineraryMap variant="overview">`. `DayCard`에 해당 일차 `mapDay` 슬라이스 전달 |
| `src/app/itinerary/_components/DayCard.tsx` | `mapDay?: ItineraryMapDay` prop. 헤더/dayNotes와 항목 목록 사이에 `points.length>0`일 때 `<ItineraryMap variant="day" days={[mapDay]}>` |
| `src/app/itinerary/_components/ItineraryClient.tsx` | 최상위에서 `useItineraryMapData` 무조건 호출(preview/saving/loginPreview면 그 days, 아니면 안정된 EMPTY). 모든 `<ItineraryResult>`·`SavedItineraryPanel`에 `mapData` 전달. `handleSave`의 `saveMutation.onSuccess`에서 `addSavedItinerary` 뒤에 `saveItineraryMapSnapshot(saved.itineraryId, toSnapshot(mapData))` |
| `src/app/itineraries/_components/SavedItinerariesList.tsx` | `useItineraryMapSnapshots()` → `loaded` 분기에서 `mapData={snapshot ? fromSnapshot(snapshot) : undefined}`. "목록에서 지우기"에서 스냅샷도 제거 |
| `src/app/share/[id]/page.tsx` | `resolveMapData = cache(async (days) => …)` — `getContentById` 병렬 + `fetchKakaoDirections`, `try/catch`로 감싸 실패해도 500 안 나게. `<ItineraryResult data={data} mapData={mapData}>` |
| `.env.local` | `KAKAO_REST_API_KEY=...` (서버 전용) |

### CSP 추가 (`next.config.ts`)

`IMAGE_HOSTS` 옆에 `KAKAO_HOSTS` 상수 정의 후:

| directive | 추가 |
|---|---|
| `script-src` | `https://dapi.kakao.com https://t1.daumcdn.net https://*.daumcdn.net` |
| `style-src` | `https://t1.daumcdn.net https://*.daumcdn.net` |
| `img-src` | `https://*.daumcdn.net https://t1.daumcdn.net https://dapi.kakao.com` (dev 브랜치는 `http://*.daumcdn.net`도) |
| `connect-src` | `https://dapi.kakao.com` (와일드카드 없음) |

길찾기(`apis-navi.kakaomobility.com`)는 **서버 Route Handler에서만** 호출 → `connect-src` 불필요. 주석 블록(~16–32줄)에 Kakao 예외를 명시(JS 키는 도메인 제한, REST 키는 서버 전용).

---

## 비자명한 구현 포인트

### SDK 로딩 — 수동 모듈 싱글턴 (라이브러리·`next/script` 아님)
한 페이지에 지도 인스턴스가 여러 개(전체 + 일차별)라 하나의 SDK 로드를 공유해야 한다. `loadKakaoMaps()`가 promise 싱글턴을 반환, `useKakaoMap`이 그것을 구독. `react-kakao-maps-sdk`는 동일한 CSP 완화가 필요하고 선언형 컴포넌트만 제공 — 레포의 무의존성 기조와 맞지 않음.

### `ItineraryMap` — React Compiler 안전 패턴
Kakao 객체는 **전부 `useRef`, 절대 state 아님**. effect 4개: ①`status==="ready"`면 `new kakao.maps.Map` 1회 ②`days` 바뀌면 오버레이 초기화 후 마커(CustomOverlay, 일차 색/번호)·Polyline(`route.path` 있으면 solid, 없으면 `shortdash` 직선)·`setBounds` ③`ResizeObserver`로 `map.relayout()` (접힌 저장목록·카드 안 지도가 나중에 보일 때 회색 타일 방지) ④unmount cleanup. 렌더는 `<div ref>` + 로딩/에러/빈 상태 오버레이.

### 길찾기 정규화 (`kakaoDirections.ts`)
Kakao는 `x`=경도 `y`=위도. `POST /v1/waypoints/directions` (단건 GET은 웨이포인트 5개 한계 → 부족). 헤더 `Authorization: KakaoAK <REST키>`. 응답 `routes[0].sections[]`(구간=연속 콘텐츠 사이 leg) → `RouteSegment[]`, `roads[].vertexes`는 평탄 `[x,y,x,y…]` → `path: [lng,lat][]`. `result_code !== 0`(101 경로없음 등) → `null` → 폴백.

### 폴백 계약
길찾기 `null` → `ItineraryMap`이 마커 사이 **점선 직선** + haversine km만 표시(시간 없음). 일차별 독립. REST 키 미설정/401도 동일 폴백.

### 스냅샷 저장/조회
`handleSave.onSuccess` 클로저의 `mapData`가 저장 시점 해석 상태 → `toSnapshot`. 아직 로딩 중인 일차는 `route:null`/빈 points로 저장되고, 조회 시 그 일차만 라이브 폴백. `SavedItinerariesList`에서 "지우기" 시 스냅샷도 purge, hydrate 시 저장목록에 없는 orphan prune.

### 공유 페이지 SSR
`getContentById`는 서버에서 `apiClient` 서버 브랜치로 백엔드 직접 호출(`@Cacheable`). `fetchKakaoDirections`는 `fetch` `next: { revalidate: 86400 }`. `mapData`는 순수 JSON이라 `"use client"` `ItineraryMap`에 그대로 전달. `NEXT_PUBLIC_KAKAO_MAP_API_KEY`는 모든 라우트 클라 번들에 인라인되므로 `/share/*`에서도 사용 가능.

---

## 단계 (각 단계 독립 배포 가능)

**P1 — 배관 (화면 변화 없음)**
`types/map.ts`, `types/kakao.d.ts`, `lib/kakaoMap.ts`, `lib/kakaoMapLoader.ts`, `lib/geo.ts`, `hooks/useKakaoMap.ts`, `contentService`+`types/content` 좌표(+테스트 갱신), `hooks/useContentCoordinates.ts`, `next.config.ts` CSP.
테스트: `geo.test.ts`, `contentService.test.ts` 갱신.

**P2 — 라이브 지도 (마커 + 직선)**
`ItineraryMap.tsx`, `useItineraryMapData.ts`(좌표만, `route:null`), `ItineraryResult`에 overview 마운트 + `mapData?` prop + 내부 폴백, `DayCard`에 일차별 마운트.
→ 미리보기·로그인프리뷰·저장목록(라이브)·공유(라이브) 모두 동작. 직선 연결 + 대략 거리.
테스트: `ItineraryMap.test.tsx`, `useItineraryMapData.test.tsx`, 마운트 테스트.

**P3 — 실제 도로 경로**
`KAKAO_REST_API_KEY`, `lib/kakaoDirections.ts`, `app/api/directions/route.ts`, `services/directionsService.ts`, `hooks/useItineraryRoute.ts`. `useItineraryMapData`가 실제 `route` 부착, 지도에 도로 경로선 + 실제 거리/시간.
테스트: `kakaoDirections.test.ts`, `route.test.ts`.

**P4 — 저장 스냅샷 + 저장 조회**
`ItineraryMapSnapshot` 타입, `lib/itineraryMapSnapshot.ts`, `stores/itineraryMapSnapshotStore.ts` + `hooks/useItineraryMapSnapshots.ts`, `useItineraryMapData`를 `ItineraryClient`로 끌어올림, `handleSave.onSuccess`에서 스냅샷 기록, `SavedItinerariesList`·`SavedItineraryPanel`이 스냅샷 소비, prune 배선.
테스트: `itineraryMapSnapshot.test.ts`, `itineraryMapSnapshotStore.test.ts`.

**P5 — 공유 SSR**
`share/[id]/page.tsx`에 `resolveMapData` 캐시 리졸버, `mapData` prop 전달, `try/catch` 방어.

---

## 테스트

- **`window.kakao` 스텁**: `src/test/kakaoMapMock.ts` — `Map`/`LatLng`/`LatLngBounds`/`Polyline`/`CustomOverlay` 최소 클래스 + `load: cb => cb()`. 테스트별 import. `vi.mock("@/lib/kakaoMapLoader")`로 로더 즉시 resolve.
- **순수 단위** (커버리지 임계 `src/lib` 80/70 충족): `geo.test.ts`(0/0 false·서울 true·도쿄 false·경계), `kakaoDirections.test.ts`(캡처 픽스처 → 총합·`segments.length === points-1`·`path` 평탄화·`result_code!==0` → null), `itineraryMapSnapshot.test.ts`(round-trip·`v` 가드), `itineraryMapSnapshotStore.test.ts`(dedupe·remove·prune·quota).
- **Route Handler**: `route.test.ts` — 잘못된 JSON/좌표 → 400, mock route → `{ok:true}`, mock null → `{ok:false}` 200.
- **컴포넌트** (실 SDK 없이): `ItineraryMap.test.tsx`(overview 2일차 → Map 1개·일차당 Polyline 1·마커 N·`setBounds` 호출·`route:null` → `shortdash`·빈 points → `MapEmpty`), `DayCard`/`ItineraryResult` 마운트 위치.

## 검증

```
bun run lint && bunx tsc --noEmit && bun run test && bun run build
```

수동 (백엔드 `localhost:8080`, `.env.local`에 두 키):

1. `bun run dev`, DevTools Console/Network 열고 CSP 위반 감시.
2. `/itinerary?...` → 생성 → 상단 전체 지도(일차 색/번호, bounds fit) + 각 DayCard 지도.
3. Network: `GET /api/v1/contents/{id}` N개(dedupe), 일차당 `POST /api/directions` → `{ok:true}`.
4. 경로선이 도로를 따라감, 일차 캡션에 도로 km + 분.
5. `KAKAO_REST_API_KEY` 제거 → 점선 직선 + haversine km, 콘솔 에러 없음.
6. 백엔드 좌표 `0,0`인 콘텐츠 → 마커 생략, 경로 스킵, 크래시 없음.
7. 저장 → `SavedItineraryPanel` 지도가 **추가 네트워크 호출 없이** 표시, `localStorage` `pick-trip-itinerary-maps` 항목 존재.
8. `/itineraries` 펼침 → 스냅샷으로 지도, 지도 네트워크 호출 0. "지우기" → 스냅샷 키 사라짐.
9. 스냅샷 키 수동 삭제 후 재조회 → 라이브 해석으로 지도 여전히 렌더.
10. 공유 링크 생성 → `/share/<token>` 지도 렌더, RSC 페이로드에 마커/경로 데이터(SSR).
11. 세 화면 모두 `Refused to load/connect` 위반 0, 응답 CSP 헤더에 새 호스트 포함.
12. `bun run build && bun run start` → 2·4·10 재확인 (프로덕션 CSP `upgrade-insecure-requests`).

---

## 리스크 / 후속

- **(권장, 비차단) 백엔드에 일정 `Item` 좌표 추가 요청** — 스케줄러가 이미 위경도를 갖고 있음(`SchedulingPlace`, `DayScheduler` haversine). 추가되면 클라이언트 N× `getContentById` 제거, 공유 페이지 서버 fan-out 제거, 스냅샷은 경로 geometry만 저장하면 됨. `useContentCoordinates`는 얇은 어댑터로 축소.
- **Kakao Mobility 쿼터/키**: REST 키를 콘솔에서 "길찾기"용으로 활성화해야 함(아니면 401/403). 무료 일일 한도 존재 → SSR `revalidate: 86400`, 클라 `staleTime: Infinity`, 스냅샷으로 저장 일정은 재호출 안 함. Route Handler에서 Kakao 에러코드 서버 로깅.
- **`/api/directions` vs `/api/:path*` rewrite**: `afterFiles` 순서상 파일시스템 라우트가 우선이라 동작. Next 업그레이드로 깨지면 증상은 404 → `/kakao/directions`로 이동.
- **이미지 스냅샷 → 상태 스냅샷**: 저장/공유 지도는 PNG가 아니라 라이브 지도 재렌더. 결과: 저장 시점의 좌표·경로 geometry는 고정되지만 타일·라벨은 조회 시점 것. localStorage 전용(기기 간 동기화 없음), 스냅샷 없으면 라이브 폴백. 진짜 정적 이미지는 서버 headless 렌더(Playwright)가 필요 — 범위 밖.
- **CSP 완화**: "외부 CDN 없음" → Kakao/Daum CDN 예외. 보완: JS 키 도메인 제한(prod 도메인 + localhost만 등록), REST 키 브라우저 미노출, `connect-src`는 `dapi.kakao.com`만.

### 열린 디자인 질문 (구현 중 확정 가능)

- 마커 스타일: 일차 색 번호 pill(제안) vs 기본 Kakao 마커.
- 연속 `PlaceItem` 행 사이마다 구간 거리/시간 표시 vs 일차 총합 + 지도 캡션만(제안: 후자, 구간별은 후속).
- `DayCard` 이동 칩을 P3에서 백엔드 스케줄러 값 → Kakao 길찾기 값으로 교체(제안: 교체, 백엔드는 폴백).
