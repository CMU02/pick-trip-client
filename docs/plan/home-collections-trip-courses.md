# 홈 Collections → "추천 여행 코스" 기능

## 배경

홈 화면의 `CollectionsSection`은 현재 `src/lib/collections.ts`의 4개 테마 묶음을
가로 구분선 리스트로 보여주고, 행을 누르면 `/explore?ids=…`(콘텐츠 그리드 필터)로만
이동한다. 일정 생성과는 연결되지 않은 예시 수준이다.

목표: 콘텐츠를 뭘 담아야 할지 모르는 사용자를 위해 **이미 장소가 짜여 있는 추천
여행 코스 5개**를 제공한다. 코스를 누르면 그 장소들이 여행 바구니에 담긴 채로
AI 일정 생성 **요약 화면**(`/itinerary`의 `PreGenerateView`)으로 이동하고, 사용자는
조건·콘텐츠를 확인한 뒤 "일정 생성하기"를 누른다.

## 확정된 결정

1. 클릭 시 도착: **요약 화면에서 멈춤** (자동 생성 안 함).
2. 기존 바구니: **담긴 게 있으면 인라인 확인** 후 교체. 비어 있으면 바로 진행.
3. 섹션 UI: **현재 가로 리스트 유지 + 지역·기간 정보 추가**.
4. 코스 구성: 아래 5개 방향으로 진행.

## 핵심 제약 (코드 탐색으로 확인)

- `/itinerary` 요약 화면은 콘텐츠를 **URL이 아니라 localStorage 바구니
  (`pick-trip-basket`)** 에서만 읽는다. 조건은 URL 쿼리(`regions`, `startDate`,
  `nights`, `companions`)로 받는다.
- "일정 생성하기" 활성 조건: `regions` 있음 + `startDate` 유효 + 바구니 ≥ 2개.
  (`src/app/itinerary/_components/PreGenerateView.tsx`)
- 저장 API가 지역을 하나만 받으므로 **코스 1개 = 지역 1개**.
- `PreGenerateView`의 바구니 항목 표시엔 `{ id, name, region, category? }` 만
  있으면 충분하다 (이미지·주소 없으면 폴백 렌더).
- 여행 바구니 스토어: `src/stores/basketStore.ts` (zustand, `save(next)`로 통째 교체),
  훅 `src/hooks/useBasket.ts`.

## 5개 추천 코스

이름 패턴: **"지역/장소 + 테마 + 기간감"** — 짧고 감성적으로, 지역과 기간을 드러냄.
장소 id는 전부 기존 `collections.ts` / `contentOverrides.ts`에서 실재 확인된 것.

| # | slug | 이름 | 지역 | 박수 | 동행 | 장소 (contentId) |
|---|---|---|---|---|---|---|
| 1 | `hadong-seomjin` | 섬진강 따라, 하동 벚꽃길 1박 2일 | HADONG | 1 | — | 평사리공원 `127665` · 하동송림공원 `126233` · 쌍계사 `128146` · 섬진강식당 `2784765` · 하동야생차박물관 `231958` |
| 2 | `hadong-tea` | 하동 티 로드, 차 향기 따라 걷는 하루 | HADONG | 0 | WITH_PARENTS | 매암차박물관 `130885` · 매암제다원 `2781622` · 도심다원 `791603` · 티카페하동 `3442627` |
| 3 | `yeongju-seonbi` | 영주, 천년 선비의 길 1박 2일 | YEONGJU | 1 | WITH_PARENTS | 부석사 `127669` · 소수서원 `126201` · 무섬마을 `894087` · 영주축협한우프라자 본점 `2841479` · 태극당 `2832268` |
| 4 | `yeongju-punggi` | 풍기 인삼과 소백산 자락, 영주 당일 나들이 | YEONGJU | 0 | — | 인삼박물관 `2406210` · 여우생태관찰원 `2616064` · 선비꽃이야기 `2832249` · 나드리 `2605878` |
| 5 | `yecheon-family` | 예천 물돌이마을과 곤충나라 (아이와 함께) | YECHEON | 1 | WITH_KIDS | 회룡포 `126734` · 예천삼강문화단지 생태공원 `2716143` · 예천 곤충생태원 `2619631` · 예천박물관 `2912292` · 강문화전시관 `2715994` |

배분: 하동 2 · 영주 2 · 예천 1 (콘텐츠 보유량 비율과 일치). 각 코스는 문화/실내 +
자연 + 음식이 섞이도록 구성.

> 구현 착수 시 로컬 백엔드 `GET /api/v1/contents?region=…` 로 위 20개 id의 실재를
> 한 번 확인한다 (TourAPI 카탈로그 변동 대비). 빠진 id는 같은 지역·카테고리의
> 다른 장소로 대체.

## 구현

### 1. `src/lib/tripCourses.ts` (신규) — `src/lib/collections.ts` 대체

```ts
export interface TripCourseSpot {
  id: string;                 // 백엔드 contentId (문자열)
  name: string;
  category?: ContentCategory;  // 요약 화면 배지용, 없어도 됨
}

export interface TripCourse {
  slug: string;
  title: string;
  desc: string;               // 한 줄 설명
  region: Region;
  nights: number;             // 0 = 당일치기
  companions: CompanionCondition[];
  spots: TripCourseSpot[];    // 3~5개
}

export const TRIP_COURSES: TripCourse[] = [ /* 위 표 5개 */ ];
```

- `Region`은 `@/types/region`, `CompanionCondition`은 `@/types/travel-condition`,
  `ContentCategory`는 `@/types/content`에서 가져온다.
- `src/lib/collections.ts` 및 `src/lib/collections.test.ts` 삭제. 삭제 전
  `HOME_COLLECTIONS` / `@/lib/collections` 의 다른 import 위치를 grep 으로 확인
  (현재는 `CollectionsSection` 하나로 파악됨. `/explore?ids=` 필터는 `ContentBrowser`가
  URL을 직접 파싱하므로 무관).

### 2. `src/app/_components/CollectionsSection.tsx` — 서버 셸 유지

- 섹션 래퍼(`<section>` + eyebrow + `<h2>`)는 서버 컴포넌트로 유지.
- eyebrow/제목 문구를 추천 코스에 맞게 조정 (예: `COLLECTIONS` → `추천 코스`,
  "테마로 묶어 담기" → "고민되면, 짜여 있는 코스로 시작").
- 리스트 본문을 새 클라이언트 컴포넌트 `<TripCourseList />` 로 위임.
- `TRIP_COURSES`가 비면 `null` 반환하는 기존 가드 유지.

### 3. `src/app/_components/TripCourseList.tsx` (신규, `"use client"`)

- `TRIP_COURSES.map(...)` 으로 기존 리스트 레이아웃 재현: 2자리 순번 · 제목/설명 ·
  우측 메타. 우측 메타에 **지역 배지 + "N박 M일"/"당일치기" + "N곳"** 추가.
- 각 행은 `<button type="button">` (localStorage 조작 후 이동해야 하므로 `<Link>` 대신).
- 훅: `useBasket()` (`items`, `save`), `useRouter()` (`next/navigation`).
- 클릭 핸들러:
  1. `items.length > 0` 이고 아직 확인 대기 중이 아니면 → 그 행을 인라인 확인
     상태로 전환 ("현재 담은 N개를 이 코스로 바꿉니다 · 계속 / 취소"). `useState`로
     `confirmingSlug` 관리.
  2. 바구니가 비었거나 확인을 눌렀으면 → `save(courseToBasketItems(course))` 후
     `router.push(itineraryHref(course))`.
- `courseToBasketItems(course)`: 각 spot을
  `{ content: { id, name, region: course.region, category: spot.category, imageUrl: null, address: "" }, addedAt: Date.now(), priority: "MUST" }`
  로 매핑 (전 항목 `"MUST"` → 요약 화면에서 "꼭 가기" 그룹으로 묶임).
- `itineraryHref(course)`:
  `/itinerary?regions=<region>&startDate=<default>&nights=<nights>` + companions 있으면 `&companions=a,b`.
- 기본 출발일: 오늘 + 14일을 `YYYY-MM-DD`로. 작은 헬퍼로 분리
  (`src/lib/`에 날짜 파라미터 헬퍼가 없으면 `tripCourses.ts` 또는 `lib/itinerary.ts`에
  `defaultTripStartDate()` 추가). 사용자는 요약 화면 "조건 수정"으로 바꿀 수 있음.

### 4. 테스트

- `src/lib/tripCourses.test.ts`: slug 유니크, 각 코스 title/desc 비어있지 않음,
  `region`이 유효한 Region, `spots` 2~5개, 모든 spot `id`가 숫자 문자열.
- `src/app/_components/TripCourseList.test.tsx` (기존 `CollectionsSection.test.tsx`
  대체): `useBasket` · `next/navigation` 모킹.
  - 코스 개수만큼 행 렌더, "N곳"이 `spots.length`와 일치.
  - 바구니 빈 상태에서 행 클릭 → `save` 가 코스 spot 수만큼 항목으로 호출되고
    `router.push` 가 기대 href로 호출.
  - 바구니 있는 상태에서 행 클릭 → `router.push` 미호출 + 확인 UI 노출,
    "계속" 클릭 시 `save` + `push` 진행.
- `src/lib/collections.test.ts` 삭제.

### 5. 문서·컨벤션

- 착수 전 `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  훑기 (서버 셸 + 작은 클라이언트 리스트 경계).
- 이 작업은 브랜치 `feat/129`(HOW 캐러셀) 범위 밖 → **새 브랜치 필요**.
  착수 전: GitHub feature 이슈 생성 (`.github/ISSUE_TEMPLATE/feature_request.md`) →
  이슈 번호로 브랜치 생성 (예: `feat/<n>`), main 기준.

## 대안 (채택 안 함, 참고)

`/itinerary?course=<slug>` 방식 — 북마크·공유로 코스 재현 가능하지만 `page.tsx`와
복잡한 `ItineraryClient` 상태 기계를 건드려야 함. 이번엔 변경을 홈 컴포넌트 +
`src/lib`로 국한한다. 추후 개선 후보.

## 검증

1. `bun run dev` → 홈 하단 추천 코스 섹션 확인. 각 행에 지역·기간·곳수 표시.
2. **빈 바구니**에서 코스 클릭 → `/itinerary?...` 요약 화면 진입, 조건 카드에
   지역·출발일·기간·동행이 채워지고, "담은 콘텐츠"에 코스 장소들이 "꼭 가기"로,
   "일정 생성하기" 버튼 활성.
3. `/contents`에서 아무 콘텐츠나 담은 뒤 홈으로 가 코스 클릭 → 인라인 확인 노출,
   "계속" → 바구니가 코스 내용으로 교체되고 요약 화면 진입.
4. 요약 화면에서 "일정 생성하기" → (로그인 시) 실제 일정 생성 성공,
   (비로그인 시) 예시 미리보기.
5. `bun run lint`, `bun test`, `bun run build` 통과.
