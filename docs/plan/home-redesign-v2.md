# 홈 화면 리디자인 v2 — TryIt · HowItWorks · Collections

이슈: CMU02/pick-trip-client#110
브랜치: `feat/110`
시안: `홈 화면 v2 (보관).dc.html` (사용자 제공, 저장소 미포함)
선행: `docs/plan/home-redesign.md`(v1, 병합 완료), `docs/plan/category-order-constant.md`(#104, 병합 완료)

## 배경

시안은 실제 컴포넌트를 기준으로 되돌린 것이라 **히어로 · 지역 섹션 · 푸터는 "이미 맞는지 확인"에 가깝다.**
실제 신규/교체 작업은 **TryIt(담아보기) · HowItWorks(작동 방식) · Collections(테마)** 세 섹션과,
Collections 링크가 걸리는 **`/explore` id 목록 필터** 추가다.

### 홈 섹션 순서 (`page.tsx` `<HomeGate>` 안)

```
Hero → RegionShowcase → TryIt → HowItWorks → Collections → Cta → Footer
```

`StepsSection` 자리에 `HowItWorksSection`이 들어가고 `TryItSection` · `CollectionsSection`이 추가된다.

## 현재 상태 조사

| 항목 | 상태 | 조치 |
|---|---|---|
| `HeroSection.tsx` | CTA 2개(`/explore`, `/select/conditions?regions=…`) · 스탯 3개(`3곳`/`221개`/`30초`) · 스트라이프 그리드 · 코랄 카드 모두 시안과 일치. 개수는 `CONTENT_COUNT = 221` 한 곳만. 배지는 `PICK TRIP`(개수 없음) | **변경 없음** |
| `RegionShowcase.tsx` | 헤더 문구 · 3열 카드(스트라이프·코랄 대시·영문 코드·지역명·`REGION_DESCRIPTIONS`·`일정 만들기 →`) · `CONDITIONS_HREF`(전체 지역) 모두 일치 | **변경 없음** |
| `Footer.tsx` | 4열(브랜드/서비스/지역/문의·지원+이메일) + 하단 저작권·약관. `콘텐츠 정보 오류 신고`는 폼 URL 미정이라 주석 유지 | **변경 없음** |
| `CtaSection.tsx` | 시안 CTA 밴드(그라데이션 카드, 버튼 2개)와 구조 일치. 시안의 basketCount 반응 카피는 로그인 상태에서만 의미 있고 현재 홈은 비로그인 전용 | **변경 없음** |
| `CONTENT_CATEGORY_ORDER` | `src/types/content.ts`에 이미 존재(`FOOD→FESTIVAL→ATTRACTION→CULTURE→NATURE→EXPERIENCE`) | 재사용 |
| `ContentFilter` 카테고리 칩 | 이미 `CONTENT_CATEGORIES`(= 순서 상수) 기반. `ContentFilter.test.tsx`에 순서 검증 존재 | **변경 없음** |
| `lib/content.ts` `groupContentsByCategory`/`sortContentsByCategory` | 이미 상수 기반. 화면 소비처는 없음(basket 페이지는 그룹핑 안 함) | **변경 없음** |
| `QuickCategoryRow.tsx` | 자체 배열 `QUICK_DEFS` 순서가 `문화·음식·관광지·자연·체험·전체` — 순서 상수와 불일치 | **순서 상수 파생으로 교체** |

## 구현

### 1. `src/lib/collections.ts` — 신규 (큐레이션 상수)

```ts
export interface HomeCollection {
  slug: string;
  title: string;
  desc: string;
  // 실제 콘텐츠 id. 화면의 "N곳"은 이 배열 길이로 계산한다.
  contentIds: string[];
}

export const HOME_COLLECTIONS: HomeCollection[] = [
  { slug: "with-kids", title: "아이와 함께 걷기 좋은 곳",
    desc: "경사가 완만하고 실내 대안이 있는 장소만 모았습니다", contentIds: [/* 채움 */] },
  { slug: "wooden-architecture", title: "천년 목조건축 순례",
    desc: "부석사 무량수전에서 쌍계사까지", contentIds: [/* 채움 */] },
  { slug: "rainy-day", title: "비 오는 날의 대안",
    desc: "실내 전시와 체험 위주로", contentIds: [/* 채움 */] },
  { slug: "riverside", title: "강 따라 걷는 하루",
    desc: "섬진강과 내성천을 잇는 코스", contentIds: [/* 채움 */] },
];
```

- 백엔드/ API에 컬렉션 개념이 없어 프론트 큐레이션 상수로 둔다.
- `contentIds`는 **실행 중인 백엔드에서 `GET /api/v1/contents`를 지역별로 조회해 시안 테마에 맞는 실제 id로 채운다.**
  (2026-08-30 기준 `localhost:8080` 미기동 — 채우기 전까지 아래 컴포넌트가 빈 컬렉션을 자동으로 숨긴다.)
- 문구는 확정본 아님. id를 채우면서 목록과 안 맞는 설명은 고친다.

### 2. `/explore` id 목록 필터

#### `src/lib/content.ts`
- 순수 헬퍼 추가 + 단위 테스트:
  ```ts
  // ids 순서를 보존해 그 id들만 남긴다. ids가 비면 그대로 반환.
  export function filterContentsByIds(contents: Content[], ids: string[]): Content[]
  ```

#### `src/components/ContentBrowser.tsx`
- `readInitialFilter()`가 `?ids=`(콤마 구분)도 읽어 `ids: string[]` 반환.
- state `idFilter: string[]` 추가(초기값 `initialFilter.ids`).
- `hasClientFilter`에 `idFilter.length > 0` 포함 → 기존 "클라이언트 필터 시 남은 페이지 백그라운드 전체 로드" 로직에 편승(원하는 id가 뒷페이지에 있어도 결국 로드됨).
- `matched` 계산에 `idFilter` 적용, `visibleFiltered` 직전에 `filterContentsByIds`로 **id 순서 보존 정렬**.
- URL 동기화 `useEffect`에 `ids` 반영(비면 삭제).
- `visibleCount` 리셋 트리거에 `idFilter` 추가.
- `ResultHeader`: `idFilter` 활성 시 요약 문구 `선택한 N곳 중 M개` + 해제 `FilterPill`(라벨 `테마 선택`, 누르면 `setIdFilter([])`). `categoryTotal`은 계산하지 않음.
- `resetFilters()`에 `setIdFilter([])` 추가.
- `/contents`도 같은 `ContentBrowser`를 쓰지만 `?ids=` 링크가 없으므로 영향 없음(범용 유지).

#### `src/app/explore/_components/ExploreGrid.tsx`
- 변경 없음(ContentBrowser가 URL을 직접 읽음). 필요 시 히어로 카피는 그대로.

### 3. `src/app/_components/TryItSection.tsx` — 신규 (서버, async)

- `page.tsx`에서 `<Suspense fallback={<TryItSkeleton/>}>`로 감싸 스트리밍(나머지 홈은 즉시 렌더).
- `await getContents({ regions: [...REGIONS], startDate: 오늘, nights: 0, size: 48 })` (try/catch, 실패 시 빈 배열).
- 렌더: 헤더(오버라인 `TRY IT` → 제목 `여기서 바로 담아보세요` → 보조문구 placeholder) + `<TryItGallery contents={contents} />`.
- 서버 컴포넌트라 보조문구의 바구니 반응·칩·카드 토글은 전부 `TryItGallery`(클라이언트)가 담당.

### 4. `src/app/_components/TryItGallery.tsx` — 신규 (`"use client"`)

- `useBasket()` 사용(새 스토어 금지).
- 칩: `["ALL", ...CONTENT_CATEGORY_ORDER]`. 선택 칩 = `ink`(oklch(0.2 0.012 30)) 배경/흰 글자, 비선택 = 흰 배경 + `oklch(0.92 0.012 30)` 테두리.
- 보조문구(바구니 개수 반응): 0개 → `두 곳만 담아도 일정을 만들 수 있어요`, N개 → `N개 담았어요. 두 곳 이상이면 바로 생성됩니다`.
  - `useBasket().items`를 직접 구독해 파생(React Compiler 메모 이슈 — `ContentCardActions` 주석 참고).
- `filtered = (cat==="ALL" ? contents : contents.filter(c => c.category === cat)).slice(0, 4)`.
- `filtered.length === 0` → 한 줄 빈 상태 `해당 카테고리 콘텐츠를 준비 중이에요` (칩은 숨기지 않음).
- 그리드 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, gap 16px. 각 카드 `<TryItCard content={c} />`.

### 5. `TryItCard` (TryItGallery.tsx 내부 컴포넌트)

- 기존 `ContentCard`/`ExploreCard`/`ContentCardActions` 재사용 검토 결과: 시안 카드는 실사진 대신 카테고리 파스텔 타일 + 아이콘, 풀폭 토글 버튼(`담기` / `✓ 담았어요`)이라 시각/라벨이 달라 **전용 카드**로 만든다. 단 담기 로직은 `useBasket().add/remove/items`만 쓴다.
- 상단 150px: 카테고리별 파스텔 그라디언트 + 가운데 흰 원(58px) 안 카테고리 아이콘(`CATEGORY_ICONS`), 좌상단 카테고리 라벨 배지. `category` 없으면 중립 그라디언트 + `map-outline`.
  - 파스텔 그라디언트/전경색 맵은 시안(`TILE_BG`/`TILE_FG`) 값을 이 파일 상수로.
- 본문: 이름(15px/700) → 주소(12px, 1줄 말줄임) → 하단 담기 버튼(full width, radius 12px).
  - 미담김: 배경 `oklch(0.955 0.04 30)` / 글자 코랄, 라벨 `담기`.
  - 담김: 배경 코랄 / 흰 글자, 라벨 `✓ 담았어요`, 카드 테두리 코랄 톤.
- `inBasket = items.some(i => i.content.id === content.id)` (스토어 함수 직접 호출 금지).

### 6. `src/app/_components/HowItWorksSection.tsx` — 신규 (서버, 정적)

`StepsSection.tsx`를 대체. `page.tsx`에서 교체.

- 섹션 배경 `oklch(0.98 0.014 32)` + 위아래 1px 보더 `oklch(0.94 0.02 30)` (홈에서 유일하게 톤이 깔리는 구간).
- 레이아웃 `grid lg:grid-cols-[1fr_1.05fr]`.
- **좌측**: 오버라인 `HOW IT WORKS` → 제목 `담아둔 순서가 아니라` / `다닐 수 있는 순서로`(2줄) → 본문 `문 여는 시간, 장소 사이 거리, 식사 시간대를 함께 봅니다. 마음에 안 드는 곳은 빼고 다시 만들 수 있습니다.` → 3행:

  | 아이콘 | 제목 | 설명 |
  |---|---|---|
  | `pin` | 이동 거리 | 가까운 곳끼리 묶어 하루 동선을 짧게 만듭니다 |
  | `calendar` | 운영 시간 | 문 여는 시간에 맞춰 방문 순서를 정합니다 |
  | `restaurant-outline` | 식사 시간 | 점심·저녁 시간대에 음식 콘텐츠를 배치합니다 |

- **우측 — 일정 예시 카드**(정적, API 호출 금지):
  - 흰 카드 radius 26px, 헤더 `1` 뱃지 + `1일차` + `9월 12일 (토)` + 우측 `예시` 배지(**반드시 유지**).
  - 타임라인 3행, 각 행 `grid-cols-[52px_24px_1fr]`: 시각(코랄) / 순번 원 + 세로선 / 장소명 + `AI` 사유 박스.
  - 행 사이 이동 시간 pill(`차로 12분`, `차로 18분`), 마지막 행은 없음.
  - 내용: `10:00 최참판댁` / `12:30 고하버거 하동본점` / `15:00 십리벚꽃길`. 사유·시간은 이 파일 상수 배열 하나.
- `ItineraryClient`의 `PlaceItem`/`DayCard`는 `Item`/`Day` 일정 타입에 강결합이고 타임라인 형태(52px 시각 열, 행 사이 leg pill)가 달라 재사용하지 않는다.
- `JOURNEY_STEPS` 상수는 삭제하지 않는다(대시보드 `ProgressStepper`, 생성 흐름 `Step N`이 참조). 홈에서만 안 쓰게 됨.

### 7. `src/app/_components/CollectionsSection.tsx` — 신규 (서버, 정적)

- `HOME_COLLECTIONS`에서 `contentIds.length > 0`인 항목만 렌더. 전부 비면 `null`(백엔드 id 채우기 전 안전장치).
- 헤더: 오버라인 `COLLECTIONS` + 제목 `테마로 묶어 담기` (좌측 정렬, 보조문구 없음).
- 카드 그리드가 아니라 **가로 구분선 리스트**: 위아래 1px 보더, 행 그리드 `grid-cols-[76px_1fr_auto]`, 패딩 `py-[26px] px-2`.
  - 좌: 번호 `01`–`NN` (Paperlogy 800, 30px, `oklch(0.68 0.11 30)`).
  - 중: 제목(Paperlogy 700, 22px) + 설명(13.5px, muted).
  - 우: `{contentIds.length}곳` pill + 코랄 `→`.
- 행은 `<Link href={`/explore?ids=${c.contentIds.join(",")}`}>`. hover 배경 `oklch(0.985 0.012 30)`.

### 8. `src/app/dashboard/_components/QuickCategoryRow.tsx` — 순서 정렬

- `QUICK_DEFS`를 `CONTENT_CATEGORY_ORDER`에서 파생: `FESTIVAL` 제외(개수 2, 시안 5칸에 없음) → 나머지 5개 순서대로 + `ALL` 마지막.
  결과 순서: `음식 · 관광지 · 문화 · 자연 · 체험 · 전체`.
- 개수는 카테고리→개수 맵으로 보존(FOOD 53 · ATTRACTION 24 · CULTURE 76 · NATURE 33 · EXPERIENCE 33 · ALL 221). 아이콘은 `CATEGORY_ICONS` + ALL은 `map-outline`.
- `QuickCategoryRow.test.tsx` 순서 기대값 갱신.

### 9. `src/app/page.tsx`

```tsx
<HomeGate>
  <HeroSection />
  <RegionShowcase />
  <Suspense fallback={<TryItSkeleton />}>
    <TryItSection />
  </Suspense>
  <HowItWorksSection />
  <CollectionsSection />
  <CtaSection />
</HomeGate>
```

- `StepsSection` import 제거, `HowItWorksSection`·`TryItSection`·`CollectionsSection`·`Suspense` 추가.
- metadata 변경 없음.

### 10. 삭제

- `src/app/_components/StepsSection.tsx`
- `src/app/_components/StepsSection.test.tsx`

## 테스트

| 파일 | 내용 |
|---|---|
| `HeroSection.test.tsx` | 기존 유지(스탯 3개 · CTA 2개) |
| `RegionShowcase.test.tsx` | 기존 유지 |
| `TryItGallery.test.tsx` | 신규 — 카드 4개 렌더 / 칩 변경 시 목록 필터 / 담기 클릭 시 `useBasketStore.getState().items` 1개 + 라벨 `✓ 담았어요` / 개수에 따라 보조문구 변경 / 칩 순서 = `["전체", ...CONTENT_CATEGORY_ORDER 라벨]` / 결과 0개 칩은 빈 상태 문구 |
| `HowItWorksSection.test.tsx` | 신규 — 기준 3행 + 예시 타임라인 3행 + `예시` 배지 렌더 (`StepsSection.test.tsx` 삭제) |
| `CollectionsSection.test.tsx` | 신규 — `@/lib/collections`를 mock(가짜 contentIds)해 행 N개 렌더 + 각 행 `N곳` = `contentIds.length` + href `/explore?ids=…` / 빈 배열만 있으면 아무것도 안 나옴 |
| `lib/content.test.ts` | `filterContentsByIds` — id 순서 보존, 없는 id 무시, 빈 ids면 원본 |
| `ExploreGrid.test.tsx` | `?ids=` 진입 시 그 id만·그 순서로 표시 / `resetFilters`·해제 pill로 복구 / URL `?ids=` 동기화 |
| `QuickCategoryRow.test.tsx` | 순서 기대값 `음식·관광지·문화·자연·체험·전체`로 갱신 |
| `lib/collections.test.ts` | (선택) slug 중복 없음, 필드 존재 |

## 검증

```bash
bun run test
bun run lint
bun run build
```

`bun run dev` 비로그인 `/` 육안 확인: 섹션 순서, TryIt 담기 토글, HowItWorks 배경 톤 + `예시` 배지, Collections 행 → `/explore?ids=` 이동.

## 완료 후

- `HOME_COLLECTIONS.contentIds`를 실행 중인 백엔드에서 채운다(백엔드 기동 필요).
- PR 생성 → `Closes #<이슈번호>`. 병합 방식 Merge Commit.

## 2026-08-30 2차 반영 (사용자 피드백)

- **지역 대표 사진**: 히어로 사진 그리드 3칸 + 지역 카드 이미지를 코랄 스트라이프에서
  VisitKorea 대표 사진으로 교체(`REGION_IMAGE_URLS` in `types/region.ts`). 지역 카드
  이미지는 `aspect-[4/3]`(콘텐츠 카드와 동일 비율), `ContentImage`로 렌더.
- **지역 카드 목적지**: `일정 만들기 → /select/conditions` → `둘러보기 → /explore?region=<지역>`
  (그 지역만 필터링). 헤더 보조문구도 갱신.
- **콘텐츠 개수 413**: 백엔드 실측 재집계(221 → 413, 하동 190 + 영주 145 + 예천 78).
  `CONTENT_COUNT`(Hero) · `CATEGORY_COUNT_BY_REGION`(content.ts) · `CATEGORY_COUNTS`·ALL
  (QuickCategoryRow) 갱신. 관련 테스트 기대값도 갱신.
- **섹션 너비 통일**: `<main className="flex flex-col">` 안에서 `mx-auto max-w-7xl`만으로는
  섹션이 콘텐츠 폭으로 줄어든다 → RegionShowcase·TryIt·HowItWorks·Collections에 `w-full`
  추가. 헤더·푸터와 동일한 `max-w-7xl` 콘텐츠 열(이 뷰포트에서 633~1913px)로 정렬.
  HowItWorks는 전체 폭 밴드 대신 `max-w-7xl` 안 톤 카드로, Cta는 전체 폭 그라디언트
  밴드 + `max-w-7xl` 콘텐츠로.
- **TryIt TanStack 캐싱**: `TryItGallery`가 `useQuery(["contents", "home-try-it", 48])`로
  조회. `TryItSection`(서버) 데이터를 `initialData`로 시드, `staleTime`=`CONTENT_LIST_STALE_TIME`.
  `["contents", …]` 프리픽스라 `Providers.setQueryDefaults(["contents"])`의 localStorage
  퍼시스터·gcTime을 상속.
- **Collections contentIds 채움**: 백엔드 실측 콘텐츠로 4개 테마 채움(`src/lib/collections.ts`).

## 범위 밖

- 티커(지역명 흐르는 띠) — 시안에서 제거, 추가 안 함.
- 히어로/지역 카드 동물 일러스트·사진 타일·지역별 색 — 코랄 스트라이프 유지.
- HowItWorks 예시 카드를 실제 API로 채우기 — 정적 + `예시` 배지 유지.
- 배경색 섹션은 HowItWorks 하나만.
- `CATEGORY_LABELS`/`CATEGORY_ICONS` 등 `Record` 매핑 — 키 순서 무관, 손대지 않음.
