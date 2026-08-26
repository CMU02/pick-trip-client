# FOR YOU / 찜한 콘텐츠 카드·레이아웃을 콘텐츠 탐색 형식으로 통일

## Context

[[explore-contents-redesign]] / `explore-redesign-step1` 작업은 `/explore`·`/contents`를
**카테고리 섹션 그룹핑 없는 `ContentBrowser` 단일 그리드 + 썸네일 우상단 반투명 지역 배지 카드**로
바꿨다. 하지만 같은 "지역 콘텐츠 카드 그리드" 성격인 다음 화면들은 옛 형식이 그대로 남아 있다.

| 화면 | 컴포넌트 | 안 맞는 점 |
| --- | --- | --- |
| `/dashboard/for-you` | `ForYouGrid` + `ForYouCard` | `groupContentsByCategory` 카테고리 섹션 유지 / 카드가 `rounded-xl` + `aspect-video` + 카테고리 배지 인라인 + 지역 배지 없음 |
| `/favorites` | `RecommendedCard` | 카드가 `rounded-xl` + `aspect-video` + 옛 배지(`top-2 left-2 text-xs`) + 지역 배지 없음 |
| `/dashboard` "님을 위한 추천" 스트립 | `ForYouSection` → `RecommendedCard` | 위 `RecommendedCard`를 공유 |
| `/contents/loading.tsx`, `/explore/loading.tsx` | 스켈레톤 | 실제 카드는 `rounded-[18px]` + `h-[140px]`인데 스켈레톤만 `rounded-xl` + `aspect-video` |

이번 작업은 이 화면들을 `/explore`·`/contents`와 동일한 형식으로 맞춘다.

## 결정 사항

- `/dashboard/for-you`는 **카드 + 레이아웃 전부** `/explore`와 동일하게 (`ContentBrowser` 채택,
  지역 탭 서버 재요청, "더보기" 페이지네이션, 단일 그리드). 상단 "For You / 님을 위한 추천 더보기"
  헤더 텍스트는 유지 — 코랄 그라데이션 히어로는 넣지 않는다.
- `RecommendedCard`도 같은 카드 스타일로 통일하고, `ContentCard`처럼 **요약(summary) 2줄**을 노출한다.
- `groupContentsByCategory`(`src/lib/content.ts`)는 삭제하지 않는다 — 홈 큐레이션 rail 재사용 예정,
  자체 테스트(`content.test.ts`)도 그대로 둔다. `ForYouGrid`에서 참조만 제거한다.
- `ForYouCard`와 `ContentCard`는 통합하지 않는다 — `ExploreCard`/`ContentCard`가 이미 별도 유지되는
  것과 같은 방침. `ForYouCard`는 `?from=for-you` 쿼리를 붙이는 점이 다르다.

## 구현

### `src/app/dashboard/for-you/page.tsx`

`ExplorePage`와 동일한 초기 fetch 구조로 맞춘다.

- `getContents`에 `size: distributePageSize(REGIONS.length)`를 넘겨 첫 화면이 대략 20개가 되게 한다.
- `res.total`도 받아 `ForYouClient`에 넘긴다.
- `queryParams = { regions: [...REGIONS], startDate, nights: 0 }`를 만들어 `ForYouClient`에 넘긴다.

### `src/app/dashboard/for-you/_components/ForYouClient.tsx`

- prop: `recommendedPool: Content[]` → `initialContents: Content[]` + `initialTotal: number` +
  `queryParams: ContentQueryParams`.
- 비로그인 가드(`useAuth` 리다이렉트)와 헤더(`For You` 오버라인 + `{nickname}님을 위한 추천 더보기`),
  `BasketLayout`(`generateHref`)은 그대로.
- `<ForYouGrid initialContents={...} initialTotal={...} queryParams={...} />`로 전달.

### `src/app/dashboard/for-you/_components/ForYouGrid.tsx`

`ExploreGrid`와 같은 구조로 축소한다.

```tsx
"use client";

import { ContentBrowser } from "@/components/ContentBrowser";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import type { Content } from "@/types/content";

import { ForYouCard } from "./ForYouCard";

interface ForYouGridProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
}

export function ForYouGrid({
  initialContents,
  initialTotal,
  queryParams,
}: ForYouGridProps) {
  return (
    <ContentBrowser
      initialContents={initialContents}
      initialTotal={initialTotal}
      queryParams={queryParams}
      renderCard={(content) => (
        <ForYouCard key={content.id} content={content} />
      )}
      gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    />
  );
}
```

- `ContentFilter` 직접 사용, `groupContentsByCategory`, 로컬 `useState` 필터 로직 전부 제거
  (`ContentBrowser`가 담당).

### `src/app/dashboard/for-you/_components/ForYouCard.tsx`

`ContentCard`와 동일한 본문 구조로 맞춘다. 차이는 링크 `?from=for-you`뿐.

- 컨테이너 `rounded-xl` → `rounded-[18px]`
- 썸네일 `aspect-video` → `h-[140px]`
- 카테고리 배지: 제목 옆 인라인 `<span>` 제거 → 썸네일 위 좌상단 오버레이
  `absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-extrabold text-primary-foreground`
- 지역 배지 신규: 썸네일 위 우상단
  `absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-extrabold text-foreground shadow-sm backdrop-blur-sm` → `{REGION_LABELS[content.region]}`
- 본문 `gap-2` → `gap-1.5`, 제목 `font-medium leading-tight` → `text-[14.5px] font-bold tracking-tight text-foreground`
- 주소 `text-xs text-muted-foreground`, 요약 `line-clamp-2 text-sm text-foreground/80` 유지
- 하단 `ContentCardActions` 유지

### `src/components/RecommendedCard.tsx`

`ContentCard`와 동일 스타일 + 요약 노출. `detailHref` 유무에 따른 클릭/비클릭 동작은 유지.

- 컨테이너 `rounded-xl` → `rounded-[18px]`
- 썸네일 `aspect-video` → `h-[140px]`, 카테고리 배지 `top-2 left-2 px-2 py-0.5 text-xs font-medium`
  → 좌상단 코랄 오버레이(`ForYouCard`와 동일 클래스)
- 지역 배지 신규: 우상단 반투명(`ForYouCard`와 동일 클래스)
- 본문: 제목 `truncate text-sm font-medium` → `text-[14.5px] font-bold tracking-tight`,
  주소 `truncate text-xs text-muted-foreground` 유지(truncate는 유지),
  **요약 추가** `line-clamp-2 text-sm text-foreground/80`
- 본문 패딩 `p-3` → `p-4 pb-2`, 액션 영역 `p-3 pt-0` → `p-4 pt-2` (`ContentCard`와 동일)
- 하단 `ContentCardActions` 유지

### 스켈레톤 (레이아웃 시프트 방지)

세 파일의 카드 스켈레톤을 실제 카드 비율(`rounded-[18px]`, 썸네일 `h-[140px]`, 요약 2줄)로 맞춘다.

- `src/app/dashboard/for-you/loading.tsx` — `ForYouCardSkeleton`
- `src/app/contents/loading.tsx` — `ContentCardSkeleton` (주석의 `aspect-video` 언급도 갱신)
- `src/app/explore/loading.tsx` — `ExploreCardSkeleton` (주석 갱신)

## 테스트

- `src/app/dashboard/for-you/_components/ForYouGrid.test.tsx` — `ExploreGrid.test.tsx` 패턴으로
  재작성. `QueryClientProvider` + `getContents` mock, "콘텐츠를 카테고리별 섹션으로 나누어 표시한다"
  테스트 삭제, 지역 탭 클릭 시 그 지역으로 재요청 + 이전 지역 카드 사라짐, 더보기/완료 문구 검증.
  `ForYouGrid`가 `initialTotal`·`queryParams` prop을 받도록 렌더 헬퍼 수정.
- `src/app/dashboard/for-you/_components/ForYouCard.test.tsx` — "지역 라벨을 썸네일 우상단 배지로
  렌더한다"(`toHaveClass("bg-white/90")`) 추가. 기존 이름/카테고리/주소/요약/`from=for-you` 테스트 유지.
- `src/app/dashboard/for-you/_components/ForYouClient.test.tsx` — 새 prop 시그니처
  (`initialContents`/`initialTotal`/`queryParams`)로 렌더 호출 수정. `QueryClientProvider` 래핑 추가
  (`ContentBrowser`가 `useInfiniteQuery` 사용).
- `src/components/RecommendedCard.test.tsx` — "지역 배지를 썸네일 우상단에 반투명 배지로 렌더한다",
  "요약을 렌더한다" 추가. 기존 이름/주소/카테고리/담기/찜/`detailHref` 테스트 유지.
- `src/app/dashboard/_components/ForYouSection.test.tsx`,
  `src/app/favorites/_components/FavoritesClient.test.tsx` — 텍스트/role 기준이라 대체로 무영향,
  실행해 확인만.

## 검증

```bash
bun run lint
bun run test
bun run build
```

`bun run dev`로 실제 확인:

- `/dashboard/for-you` — 카테고리 섹션 없이 단일 그리드, 지역 탭 클릭 시 그 지역만 재로드,
  "더보기"가 끝에만 카드를 붙임, 카드 우상단 지역 배지
- `/favorites`, `/dashboard` "님을 위한 추천" 스트립 — 카드가 `/contents`와 같은 모양(지역 배지 + 요약)
- 로딩 시 스켈레톤과 실제 카드 높이가 어긋나지 않음
