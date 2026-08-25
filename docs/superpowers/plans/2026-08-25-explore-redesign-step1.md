# 콘텐츠 탐색 레이아웃 개편 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/explore`, `/contents`의 카테고리 섹션 그룹핑 + 전역 "더보기"를 지역 탭(서버 요청 조건) + 카테고리 칩(클라이언트 필터) + 그룹핑 없는 단일 그리드 + 항상 끝에만 붙는 "더보기"로 교체한다.

**Architecture:** `ContentFilter`를 지역 단일탭/카테고리 가로스크롤 칩으로 바꾸고, 필터+헤더+그리드+더보기를 묶은 신규 `ContentBrowser`(카드 렌더는 `renderCard` prop으로 주입)를 `ExploreGrid`/`ContentGrid`가 각자의 히어로/`BasketLayout`으로 감싼다. `useLoadMoreContents`는 지역 탭 전환 시 SSR로 받은 초기 시드를 잘못 재사용하지 않도록 조건부 `initialData`로 바꾸고, "간략히"가 없어지므로 `visiblePageCount`/`collapse`를 통째로 제거한다(그러면 `contents`는 항상 로드된 페이지 전부의 병합이라 "새 항목은 끝에만 붙는다"가 구조적으로 보장됨).

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query(`useInfiniteQuery`), Tailwind 4, Bun, Vitest + Testing Library, Biome.

**Spec:** `docs/plan/explore-redesign.md` (지시서), `docs/plan/explore-prototype.html` (프로토타입, "제안 방식" 탭)

## Global Constraints

- 패키지 매니저는 Bun. 모든 검증은 `bun run lint`(Biome), `bun run test`(vitest).
- `src/lib/content.ts`의 `groupContentsByCategory`는 삭제하지 않는다(홈 큐레이션 rail 재사용 예정, 기존 테스트 유지).
- `ExploreCard`(담기 없음)와 `ContentCard`(담기 있음)는 통합하지 않는다 — 이슈 #57 결정 유지.
- 서버 컴포넌트(`explore/page.tsx`, `contents/page.tsx`)의 초기 fetch 구조(지역 fan-out, 0페이지 시드)는 그대로 둔다 — 첫 화면은 계속 서버 렌더.
- 지역은 서버 요청 조건, 카테고리/검색어는 클라이언트 필터로 남는다(백엔드에 category 파라미터 없음 — 3단계로 별도 이슈).
- 이번 PR 범위는 지시서의 1단계뿐. 2단계(URL 상태), 3단계(백엔드)는 손대지 않는다.

---

## 사전 확인된 사실 (탐색 결과)

- `useLoadMoreContents`는 `useInfiniteQuery` 기반. `queryFn`은 `getContents({...queryParams, page, size:20})`. `getNextPageParam`은 로드된 개수가 `lastPage.total`에 도달하면 `undefined`.
- `ContentGrid`(`/contents`)의 `queryParams.regions`는 **URL의 `regions` 검색 파라미터** — AI 일정 조건 선택 단계에서 고른 지역들(1~3개, 항상 3개는 아님). `ExploreGrid`(`/explore`)의 `queryParams.regions`는 항상 `[...REGIONS]`.
  → **지역 탭 목록은 `@/types/region`의 `REGIONS` 상수를 그대로 쓰지 않고, `ContentBrowser`에 넘어온 `queryParams.regions`(호출부가 이미 정한 "허용된 지역 집합")를 소스로 삼는다.** 지시서 1-3의 의사코드(`REGIONS.filter(...)` 같은 전역 상수 사용)를 그대로 따르면, `/contents`에서 사용자가 조건 선택 때 고르지 않은 지역까지 "전체" 탭에 다시 섞여 들어가는 버그가 생긴다. 이 계획은 그 버그를 피하도록 `allowedRegions = REGIONS.filter(r => queryParams.regions.includes(r))`로 스코프를 좁힌다.
- `ContentCard.tsx`는 최근 커밋(`c4b241b`)에서 지역 배지를 카테고리 배지 옆 **코랄(`bg-primary`) 스타일**로 이미 추가했다. 지시서 1-5는 "우상단 반투명" 스타일을 요구하므로, 이번 작업은 기존 배지를 **삭제 후 재추가가 아니라 위치/스타일만 우상단 반투명으로 이동**한다. 관련 테스트(`ContentCard.test.tsx`의 "지역 배지를 카테고리 배지와 나란히 코랄 배경/흰 글씨로 렌더한다")도 새 스타일 기준으로 고친다.
- `useBasket`/`ContentCardActions`의 액션은 카드 하단에만 있어 우상단 배지와 겹치지 않는다.
- 카테고리 칩 가로 스크롤에 쓸 `chevron-left`/`chevron-right` 아이콘은 `src/components/ui/icon.tsx`에 이미 있다. 별도 scrollbar-hide 유틸 클래스는 없으므로 `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` 임의 속성을 그 자리에서 쓴다.
- "간략히" 제거 + `visiblePageCount` 삭제로, 지시서 "주의 2"(리셋 문제)는 애초에 발생하지 않는다(그 상태 자체가 없어짐). "주의 1"(조건부 `initialData`)만 실제로 구현이 필요하다.

## 핵심 타입/시그니처 (여러 태스크가 공유)

```ts
// src/hooks/useLoadMoreContents.ts
export interface UseLoadMoreContentsResult {
  contents: Content[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;       // 신규: 초기 데이터가 전혀 없는 첫 로딩(지역 탭 전환 등)
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadMore: () => void;
  // canCollapse / collapse 제거
}
interface UseLoadMoreContentsParams {
  queryKey: readonly unknown[];
  queryParams: ContentQueryParams;
  initialContents?: Content[];  // optional로 변경
  initialTotal?: number;        // optional로 변경
  pageSize?: number;
}
```

```ts
// src/components/ContentFilter.tsx
interface ContentFilterProps {
  regions: Region[];                          // 탭으로 보여줄 허용된 지역 집합 (전체 REGIONS 아님)
  selectedRegion: Region | "ALL";
  selectedCategories: ContentCategory[];
  keyword: string;
  onRegionChange: (region: Region | "ALL") => void;
  onCategoryChange: (categories: ContentCategory[]) => void;
  onKeywordChange: (keyword: string) => void;
}
```

```ts
// src/components/ContentBrowser.tsx
interface ContentBrowserProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;             // .regions = 허용된 지역 집합(탭 소스)
  renderCard: (content: Content) => ReactNode;  // 호출부가 key까지 채워서 반환
  gridClassName: string;                        // "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 등
}
```

---

### Task 1: `useLoadMoreContents` — 조건부 시드 + collapse 제거

**Files:**
- Modify: `src/hooks/useLoadMoreContents.ts`
- Test: `src/hooks/useLoadMoreContents.test.tsx`

**Interfaces:**
- Produces: 위 `UseLoadMoreContentsResult`/`UseLoadMoreContentsParams` (Task 2·4·5가 그대로 소비)

- [ ] **Step 1: 실패하는 테스트 추가 — 시드 없이 마운트하면 즉시 fetch한다**

`src/hooks/useLoadMoreContents.test.tsx`에 추가(기존 `makeContent`/`createWrapper`/`queryParams` 재사용):

```tsx
it("initialContents/initialTotal을 넘기지 않으면 마운트 즉시 0페이지를 요청한다", async () => {
  mockGetContents.mockResolvedValueOnce({
    contents: [makeContent("1")],
    total: 1,
  } satisfies ContentsResponse);

  const { result } = renderHook(
    () =>
      useLoadMoreContents({
        queryKey: ["contents", queryParams],
        queryParams,
      }),
    { wrapper: createWrapper() },
  );

  expect(result.current.isLoading).toBe(true);
  expect(result.current.contents).toHaveLength(0);

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(mockGetContents).toHaveBeenCalledWith({
    ...queryParams,
    page: 0,
    size: 20,
  });
  expect(result.current.contents.map((c) => c.id)).toEqual(["1"]);
});
```

같은 파일에서 `collapse`/`canCollapse` 관련 테스트 2개(`"collapse 호출 시 첫 페이지만 남고..."`, `"collapse 후 loadMore를 다시 호출하면..."`) **삭제**. 나머지 기존 테스트는 시그니처 변경 없이 통과해야 한다(옵셔널 파라미터라 기존 호출부 호환).

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `bun run test src/hooks/useLoadMoreContents.test.tsx`
Expected: 새 테스트 FAIL("initialData 없이도 seed된 것처럼 동작" 등 현재 구현과 불일치), collapse 테스트는 이미 지웠으므로 실행되지 않음.

- [ ] **Step 3: 구현**

```ts
// src/hooks/useLoadMoreContents.ts 전체 교체
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  getContentFetchErrorMessage,
  mergeUniqueContents,
} from "@/lib/content";
import { type GetContentsParams, getContents } from "@/services/contentService";
import type { Content, ContentsResponse } from "@/types/content";

// 백엔드 /api/v1/contents의 기본 size(20)와 동일하게 맞춰, "더보기"가 항상
// 서버 기본 페이지와 같은 크기로 다음 페이지를 요청하게 한다.
export const CONTENT_PAGE_SIZE = 20;

export type ContentQueryParams = Omit<GetContentsParams, "page" | "size">;

interface UseLoadMoreContentsParams {
  // 검색 조건(지역/날짜/박수/동반자)이 바뀌면 새 쿼리로 취급되어 누적 상태가
  // 자동으로 초기화되도록, 조건을 그대로 쿼리 키에 포함한다.
  queryKey: readonly unknown[];
  queryParams: ContentQueryParams;
  // 서버 컴포넌트가 이미 이 조건으로 0페이지를 받아온 경우에만 넘긴다.
  // (예: 지역 탭이 "전체"일 때) 조건이 바뀌어 SSR 데이터를 재사용할 수 없으면
  // 둘 다 생략하고, 훅이 마운트 즉시 네트워크로 0페이지를 받아오게 한다.
  initialContents?: Content[];
  initialTotal?: number;
  pageSize?: number;
}

interface UseLoadMoreContentsResult {
  contents: Content[];
  total: number;
  hasMore: boolean;
  // 시드도 없고 아직 아무 페이지도 못 받은 첫 로딩 상태(스켈레톤용).
  isLoading: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadMore: () => void;
}

export function useLoadMoreContents({
  queryKey,
  queryParams,
  initialContents,
  initialTotal,
  pageSize = CONTENT_PAGE_SIZE,
}: UseLoadMoreContentsParams): UseLoadMoreContentsResult {
  const hasSeed = initialContents !== undefined && initialTotal !== undefined;

  const query = useInfiniteQuery<ContentsResponse>({
    queryKey,
    queryFn: ({ pageParam }) =>
      getContents({
        ...queryParams,
        page: pageParam as number,
        size: pageSize,
      }),
    initialPageParam: 0,
    // 이번 페이지에서 아무 항목도 못 받았거나, 지금까지 받은 개수가 total에
    // 이미 도달했으면 더 요청하지 않는다. 지역별로 먼저 소진된 지역은 빈
    // items를 반환하므로(백엔드 확인 완료) 별도 에러 처리 없이 안전하다.
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.contents.length === 0) return undefined;
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.contents.length,
        0,
      );
      return loadedCount < lastPage.total ? allPages.length : undefined;
    },
    // 서버 컴포넌트가 이미 이 조건으로 받아온 0페이지가 있을 때만 시드한다.
    // 지역 탭 전환처럼 조건이 SSR 시점과 달라지면 시드를 생략해 마운트
    // 즉시 새 조건으로 네트워크 요청을 보내게 한다(다른 조건 데이터가
    // 화면에 남아있는 걸 막는다).
    initialData: hasSeed
      ? {
          pages: [
            { contents: initialContents ?? [], total: initialTotal ?? 0 },
          ],
          pageParams: [0],
        }
      : undefined,
    // 시드가 있을 때만 무한대로 둔다 — 시드가 없으면 기본 staleTime(0)이라
    // 마운트 즉시(첫 fetch로) 데이터를 받아온다.
    staleTime: hasSeed ? Number.POSITIVE_INFINITY : undefined,
  });

  const pages = query.data?.pages ?? [];
  const contents = mergeUniqueContents(pages.flatMap((p) => p.contents));
  const total = pages.at(-1)?.total ?? initialTotal ?? 0;

  return {
    contents,
    total,
    hasMore: contents.length < total,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    errorMessage: query.isError
      ? getContentFetchErrorMessage(query.error)
      : null,
    loadMore: () => {
      void query.fetchNextPage();
    },
  };
}
```

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `bun run test src/hooks/useLoadMoreContents.test.tsx`
Expected: PASS (기존 8개 + 신규 1개 - 삭제된 2개 = 총 9개)

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useLoadMoreContents.ts src/hooks/useLoadMoreContents.test.tsx
git commit -m "refactor(hooks): useLoadMoreContents 조건부 시드 + collapse 제거"
```

---

### Task 2: `ContentFilter` — 지역 단일 탭 + 카테고리 가로 스크롤

**Files:**
- Modify: `src/components/ContentFilter.tsx`
- Test: `src/components/ContentFilter.test.tsx`

**Interfaces:**
- Consumes: 없음(순수 프레젠테이션)
- Produces: 위 `ContentFilterProps` (Task 4·5가 소비)

- [ ] **Step 1: 테스트를 새 시그니처로 다시 쓴다**

`src/components/ContentFilter.test.tsx` 전체를 아래로 교체(기존 파일 구조 유지, `regions`/`selectedRegion` prop만 반영):

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContentFilter } from "./ContentFilter";

const REGIONS3 = ["HADONG", "YEONGJU", "YECHEON"] as const;

function setup(overrides: Partial<React.ComponentProps<typeof ContentFilter>> = {}) {
  const props = {
    regions: [...REGIONS3],
    selectedRegion: "ALL" as const,
    selectedCategories: [],
    keyword: "",
    onRegionChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onKeywordChange: vi.fn(),
    ...overrides,
  };
  render(<ContentFilter {...props} />);
  return props;
}

describe("ContentFilter", () => {
  it("전체 탭 + 지역 탭 + 6개 카테고리 칩을 렌더한다", () => {
    setup();

    expect(screen.getByRole("tab", { name: /전체/ })).toBeInTheDocument();
    for (const label of ["하동", "영주", "예천"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
    for (const label of ["음식", "축제", "관광지", "문화", "자연", "체험"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("regions prop이 준 지역만 탭으로 렌더한다", () => {
    setup({ regions: ["HADONG"] });

    expect(screen.getByRole("tab", { name: "하동" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "영주" })).not.toBeInTheDocument();
  });

  it("지역 탭 클릭 시 onRegionChange를 그 지역으로 호출한다", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("tab", { name: "하동" }));

    expect(props.onRegionChange).toHaveBeenCalledWith("HADONG");
  });

  it("전체 탭 클릭 시 onRegionChange를 ALL로 호출한다", async () => {
    const props = setup({ selectedRegion: "HADONG" });

    await userEvent.click(screen.getByRole("tab", { name: /전체/ }));

    expect(props.onRegionChange).toHaveBeenCalledWith("ALL");
  });

  it("선택된 지역 탭만 aria-selected=true다", () => {
    setup({ selectedRegion: "HADONG" });

    expect(screen.getByRole("tab", { name: "하동" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "영주" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: /전체/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("카테고리 칩은 라벨 글자 앞에 카테고리 아이콘을 렌더한다", () => {
    setup();

    for (const label of ["음식", "축제", "관광지", "문화", "자연", "체험"]) {
      const button = screen.getByRole("button", { name: label });
      expect(button.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("카테고리 칩 클릭 시 onCategoryChange를 호출한다", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("button", { name: "음식" }));

    expect(props.onCategoryChange).toHaveBeenCalledWith(["FOOD"]);
  });

  it("선택된 카테고리 칩은 aria-pressed=true 속성을 갖는다", () => {
    setup({ selectedCategories: ["FOOD"] });

    expect(screen.getByRole("button", { name: "음식" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "자연" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("검색어 입력 시 onKeywordChange를 호출한다", async () => {
    const props = setup();

    await userEvent.type(screen.getByRole("searchbox"), "쌍");

    expect(props.onKeywordChange).toHaveBeenLastCalledWith("쌍");
  });
});
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `bun run test src/components/ContentFilter.test.tsx`
Expected: FAIL (현재 컴포넌트는 `regions`/`selectedRegion` prop이 없고 지역이 `role="tab"`이 아님)

- [ ] **Step 3: 구현**

```tsx
// src/components/ContentFilter.tsx 전체 교체
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type ContentCategory,
} from "@/types/content";
import { REGION_LABELS, type Region } from "@/types/region";

interface ContentFilterProps {
  regions: Region[];
  selectedRegion: Region | "ALL";
  selectedCategories: ContentCategory[];
  keyword: string;
  onRegionChange: (region: Region | "ALL") => void;
  onCategoryChange: (categories: ContentCategory[]) => void;
  onKeywordChange: (keyword: string) => void;
}

export function ContentFilter({
  regions,
  selectedRegion,
  selectedCategories,
  keyword,
  onRegionChange,
  onCategoryChange,
  onKeywordChange,
}: ContentFilterProps) {
  function toggleCategory(category: ContentCategory) {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="지역"
        className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <RegionTab
          label="전체"
          selected={selectedRegion === "ALL"}
          onClick={() => onRegionChange("ALL")}
        />
        {regions.map((region) => (
          <RegionTab
            key={region}
            label={REGION_LABELS[region]}
            selected={selectedRegion === region}
            onClick={() => onRegionChange(region)}
          />
        ))}
      </div>

      <CategoryChipRow
        selectedCategories={selectedCategories}
        onToggle={toggleCategory}
      />

      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Icon
          name="search"
          size={16}
          className="shrink-0 text-muted-foreground"
        />
        <input
          type="search"
          placeholder="장소 이름이나 주소로 검색"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="h-full flex-1 border-0 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function RegionTab({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={
        selected
          ? "relative px-3.5 pt-2 pb-2.5 text-[15px] font-bold whitespace-nowrap text-primary after:absolute after:right-2 after:bottom-0 after:left-2 after:h-[2.5px] after:rounded-full after:bg-primary after:content-['']"
          : "px-3.5 pt-2 pb-2.5 text-[15px] font-bold whitespace-nowrap text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}

function CategoryChipRow({
  selectedCategories,
  onToggle,
}: {
  selectedCategories: ContentCategory[];
  onToggle: (category: ContentCategory) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  function scrollByAmount(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          aria-label="이전 카테고리"
          onClick={() => scrollByAmount(-220)}
          className="absolute top-1/2 left-0 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <Icon name="chevron-left" size={14} />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CONTENT_CATEGORIES.map((category) => {
          const selected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(category)}
              className={
                selected
                  ? "flex shrink-0 items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-accent-foreground"
                  : "flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm whitespace-nowrap hover:border-primary/40"
              }
            >
              <Icon name={CATEGORY_ICONS[category]} size={14} />
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          type="button"
          aria-label="다음 카테고리"
          onClick={() => scrollByAmount(220)}
          className="absolute top-1/2 right-0 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <Icon name="chevron-right" size={14} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `bun run test src/components/ContentFilter.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/ContentFilter.tsx src/components/ContentFilter.test.tsx
git commit -m "refactor(components): ContentFilter를 지역 단일탭 + 카테고리 가로스크롤로 변경"
```

---

### Task 3: `ContentBrowser` 신규 (필터+헤더+그리드+더보기 공용화)

**Files:**
- Create: `src/components/ContentBrowser.tsx`

**Interfaces:**
- Consumes: `ContentFilter`(Task 2), `useLoadMoreContents`(Task 1)
- Produces: `ContentBrowser` — Task 4가 `ExploreGrid`/`ContentGrid`에서 사용

- [ ] **Step 1: 구현** (별도 유닛 테스트 없음 — Task 4의 `ExploreGrid`/`ContentGrid` 테스트로 통합 검증)

```tsx
"use client";

import { type ReactNode, useState } from "react";

import { ContentFilter } from "@/components/ContentFilter";
import {
  type ContentQueryParams,
  useLoadMoreContents,
} from "@/hooks/useLoadMoreContents";
import type { Content, ContentCategory } from "@/types/content";
import { CATEGORY_LABELS } from "@/types/content";
import { REGION_LABELS, REGIONS, type Region } from "@/types/region";

interface ContentBrowserProps {
  initialContents: Content[];
  initialTotal: number;
  // .regions는 이 화면에서 탐색을 허용할 지역 집합(탭 소스)이기도 하다.
  // /explore는 항상 REGIONS 전체, /contents는 사용자가 조건 선택 단계에서
  // 고른 지역만 들어온다 — 여기서 REGIONS 전체로 되돌리면 안 된다.
  queryParams: ContentQueryParams;
  renderCard: (content: Content) => ReactNode;
  gridClassName: string;
}

export function ContentBrowser({
  initialContents,
  initialTotal,
  queryParams,
  renderCard,
  gridClassName,
}: ContentBrowserProps) {
  const allowedRegions = REGIONS.filter((r) => queryParams.regions.includes(r));

  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL");
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");

  const isInitial = selectedRegion === "ALL";
  const effectiveRegions = isInitial ? allowedRegions : [selectedRegion];
  const effectiveParams: ContentQueryParams = {
    ...queryParams,
    regions: effectiveRegions,
  };

  const {
    contents: loadedContents,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMore,
  } = useLoadMoreContents({
    queryKey: ["contents", effectiveParams],
    queryParams: effectiveParams,
    initialContents: isInitial ? initialContents : undefined,
    initialTotal: isInitial ? initialTotal : undefined,
  });

  const q = keyword.trim().toLowerCase();
  const hasClientFilter = selectedCategories.length > 0 || q !== "";
  const filtered = loadedContents.filter((c) => {
    const matchCategory =
      selectedCategories.length === 0 ||
      (c.category !== undefined && selectedCategories.includes(c.category));
    const matchKeyword =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    return matchCategory && matchKeyword;
  });

  function resetFilters() {
    setSelectedRegion("ALL");
    setSelectedCategories([]);
    setKeyword("");
  }

  return (
    <div className="flex flex-col gap-4">
      <ContentFilter
        regions={allowedRegions}
        selectedRegion={selectedRegion}
        selectedCategories={selectedCategories}
        keyword={keyword}
        onRegionChange={setSelectedRegion}
        onCategoryChange={setSelectedCategories}
        onKeywordChange={setKeyword}
      />

      <ResultHeader
        total={total}
        loadedCount={loadedContents.length}
        filteredCount={filtered.length}
        hasClientFilter={hasClientFilter}
        selectedRegion={selectedRegion}
        selectedCategories={selectedCategories}
        keyword={keyword}
        onClearRegion={() => setSelectedRegion("ALL")}
        onClearCategory={(c) =>
          setSelectedCategories(selectedCategories.filter((x) => x !== c))
        }
        onClearKeyword={() => setKeyword("")}
        onResetAll={resetFilters}
      />

      {isLoading ? (
        <SkeletonGrid gridClassName={gridClassName} />
      ) : filtered.length === 0 ? (
        <p className="flex min-h-[40vh] items-center justify-center text-center text-sm text-muted-foreground">
          {loadedContents.length === 0
            ? "콘텐츠가 없습니다"
            : "조건에 맞는 콘텐츠가 없습니다"}
        </p>
      ) : (
        <div className={`grid gap-4 ${gridClassName}`}>
          {filtered.map((c) => renderCard(c))}
          {isLoadingMore && <SkeletonCards gridClassName="" count={4} />}
        </div>
      )}

      {errorMessage && (
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      )}

      <MoreZone
        loadedCount={loadedContents.length}
        total={total}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}

function ResultHeader({
  total,
  loadedCount,
  filteredCount,
  hasClientFilter,
  selectedRegion,
  selectedCategories,
  keyword,
  onClearRegion,
  onClearCategory,
  onClearKeyword,
  onResetAll,
}: {
  total: number;
  loadedCount: number;
  filteredCount: number;
  hasClientFilter: boolean;
  selectedRegion: Region | "ALL";
  selectedCategories: ContentCategory[];
  keyword: string;
  onClearRegion: () => void;
  onClearCategory: (category: ContentCategory) => void;
  onClearKeyword: () => void;
  onResetAll: () => void;
}) {
  const hasAnyFilter =
    selectedRegion !== "ALL" || selectedCategories.length > 0 || keyword.trim() !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold">
        {hasClientFilter
          ? `불러온 ${loadedCount}개 중 ${filteredCount}개`
          : `${total}개 결과`}
      </span>

      {selectedRegion !== "ALL" && (
        <FilterPill
          label={REGION_LABELS[selectedRegion]}
          onClear={onClearRegion}
        />
      )}
      {selectedCategories.map((c) => (
        <FilterPill
          key={c}
          label={CATEGORY_LABELS[c]}
          onClear={() => onClearCategory(c)}
        />
      ))}
      {keyword.trim() && (
        <FilterPill label={`"${keyword.trim()}"`} onClear={onClearKeyword} />
      )}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={onResetAll}
          className="text-sm font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          초기화
        </button>
      )}

      {!hasClientFilter && total > 0 && (
        <span className="ml-auto text-xs text-muted-foreground">
          {loadedCount} / {total} 표시 중
        </span>
      )}
    </div>
  );
}

function FilterPill({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pr-2 pl-2.5 text-[13px] font-bold text-accent-foreground">
      {label}
      <button
        type="button"
        aria-label={`${label} 해제`}
        onClick={onClear}
        className="opacity-65 hover:opacity-100"
      >
        <Icon name="close" size={12} />
      </button>
    </span>
  );
}

function MoreZone({
  loadedCount,
  total,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  loadedCount: number;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (!hasMore) {
    return total > 0 ? (
      <p className="flex items-center justify-center gap-1.5 py-6 text-sm font-medium text-muted-foreground">
        {total}개를 모두 확인했어요
      </p>
    ) : null;
  }

  const pct = total > 0 ? Math.round((loadedCount / total) * 100) : 0;
  const nextCount = Math.min(CONTENT_PAGE_SIZE, total - loadedCount);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-[15px] font-bold shadow-sm transition hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {isLoadingMore ? "불러오는 중" : `${nextCount}개 더보기`}
      </button>
      <div className="h-[3px] w-48 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {loadedCount} / {total}
      </span>
    </div>
  );
}

function SkeletonGrid({ gridClassName }: { gridClassName: string }) {
  return (
    <div className={`grid gap-4 ${gridClassName}`}>
      <SkeletonCards gridClassName="" count={8} />
    </div>
  );
}

function SkeletonCards({ count }: { gridClassName: string; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 고정 개수 스켈레톤이라 순서/식별자가 의미 없음
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[18px] border border-border bg-card"
        >
          <div className="h-[150px] bg-muted" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="h-2.5 w-2/5 rounded-full bg-muted" />
            <div className="h-2.5 w-4/5 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
```

`Icon`/`CONTENT_PAGE_SIZE` import 추가 필요:
```ts
import { Icon } from "@/components/ui/icon";
import { CONTENT_PAGE_SIZE } from "@/hooks/useLoadMoreContents";
```

- [ ] **Step 2: 타입체크 + lint**

Run: `bun run lint`
Expected: `ContentBrowser.tsx` 관련 에러 없음(미사용 import 등 정리)

- [ ] **Step 3: 커밋**

```bash
git add src/components/ContentBrowser.tsx
git commit -m "feat(components): 필터+헤더+그리드+더보기를 묶은 ContentBrowser 추가"
```

---

### Task 4: `ExploreGrid`/`ContentGrid`가 `ContentBrowser` 사용하도록 교체

**Files:**
- Modify: `src/app/explore/_components/ExploreGrid.tsx`
- Modify: `src/app/contents/_components/ContentGrid.tsx`
- Test: `src/app/explore/_components/ExploreGrid.test.tsx`
- Test: `src/app/contents/_components/ContentGrid.test.tsx`

**Interfaces:**
- Consumes: `ContentBrowser`(Task 3), `ExploreCard`/`ContentCard`(Task 5 — region 배지는 이 태스크 이후에 반영되지만 카드 자체는 이미 존재하므로 순서 무관)

- [ ] **Step 1: 두 테스트 파일을 새 동작 기준으로 다시 쓴다**

공통 변경 포인트:
- "지역 필터 선택 시..." 계열 테스트는 이제 **실제 재요청**이 일어나므로, `mockGetContents.mockResolvedValueOnce`로 그 지역만 필터된 결과를 스텁하고 클릭 후 `getContents`가 그 지역으로 호출됐는지 + 새 카드가 보이는지를 확인한다.
- "카테고리별 섹션 헤딩" 테스트(`getByRole("heading", {name: /문화/})` 등)는 그룹핑이 사라졌으므로 **삭제**한다.
- "더보기" 관련 테스트는 유지하되 "간략히" 관련 부분은 삭제하고, 완료 문구(`"...개를 모두 확인했어요"`) 테스트를 추가한다.
- 신규: "지역 탭 전환 시 다른 지역 데이터가 남아있지 않다" + "지역 탭 전환 시 getContents가 선택한 지역으로만 호출된다".

`src/app/explore/_components/ExploreGrid.test.tsx` 전체 교체:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/contentService", () => ({
  getContents: vi.fn(),
}));

import { getContents } from "@/services/contentService";
import type { Content } from "@/types/content";

import { ExploreGrid } from "./ExploreGrid";

const mockGetContents = vi.mocked(getContents);

const makeContent = (overrides: Partial<Content> = {}): Content => ({
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군 화개면",
  summary: "천년 고찰",
  indoor: false,
  ...overrides,
});

const defaultQueryParams = {
  regions: ["HADONG", "YEONGJU", "YECHEON"],
  startDate: "2026-06-20",
  nights: 0,
};

function renderExploreGrid({
  initialContents,
  initialTotal = initialContents.length,
  queryParams = defaultQueryParams,
}: {
  initialContents: Content[];
  initialTotal?: number;
  queryParams?: typeof defaultQueryParams;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ExploreGrid
        initialContents={initialContents}
        initialTotal={initialTotal}
        queryParams={queryParams}
      />
    </QueryClientProvider>,
  );
}

describe("ExploreGrid", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("전달받은 콘텐츠 카드를 모두 렌더한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("하동 재첩국")).toBeInTheDocument();
  });

  it("카테고리 필터 선택 시 해당 카테고리만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("검색어 입력 시 이름이 일치하는 카드만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.type(screen.getByRole("searchbox"), "쌍계");

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("필터 결과가 없을 때 빈 상태 메시지를 표시한다", async () => {
    renderExploreGrid({
      initialContents: [makeContent({ name: "쌍계사" })],
    });

    await userEvent.type(screen.getByRole("searchbox"), "없는콘텐츠xyz");

    expect(
      screen.getByText(/조건에 맞는 콘텐츠가 없습니다/),
    ).toBeInTheDocument();
  });

  it("콘텐츠가 없을 때 빈 상태 메시지를 표시한다", () => {
    renderExploreGrid({ initialContents: [] });

    expect(screen.getByText(/콘텐츠가 없습니다/)).toBeInTheDocument();
  });

  it("지역 탭 전환 시 그 지역으로만 getContents를 호출하고, 이전 지역 카드는 사라진다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent({ id: "2", name: "부석사", region: "YEONGJU" })],
      total: 1,
    });

    renderExploreGrid({
      initialContents: [makeContent({ id: "1", name: "쌍계사", region: "HADONG" })],
    });

    await userEvent.click(screen.getByRole("tab", { name: "영주" }));

    await waitFor(() =>
      expect(mockGetContents).toHaveBeenCalledWith({
        ...defaultQueryParams,
        regions: ["YEONGJU"],
        page: 0,
        size: 20,
      }),
    );
    await waitFor(() => expect(screen.getByText("부석사")).toBeInTheDocument());
    expect(screen.queryByText("쌍계사")).not.toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length보다 크면 더보기 버튼이 보인다", () => {
    renderExploreGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 3,
    });

    expect(screen.getByRole("button", { name: /더보기/ })).toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length와 같으면 완료 문구가 보인다", () => {
    renderExploreGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 1,
    });

    expect(
      screen.queryByRole("button", { name: /더보기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/모두 확인했어요/)).toBeInTheDocument();
  });

  it("더보기 클릭 시 다음 페이지를 요청하고 결과를 끝에 이어붙인다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent({ id: "2", name: "화개장터" })],
      total: 2,
    });

    renderExploreGrid({
      initialContents: [makeContent({ id: "1", name: "쌍계사" })],
      initialTotal: 2,
    });

    await userEvent.click(screen.getByRole("button", { name: /더보기/ }));

    expect(mockGetContents).toHaveBeenCalledWith({
      ...defaultQueryParams,
      page: 1,
      size: 20,
    });
    await waitFor(() =>
      expect(screen.getByText("화개장터")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText(/모두 확인했어요/)).toBeInTheDocument(),
    );

    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["쌍계사", "화개장터"]);
  });
});
```

`src/app/contents/_components/ContentGrid.test.tsx`도 동일한 방향으로 다시 쓴다 — 기존 파일의 `useBasketStore` mock/`담기` 버튼 테스트, `next/navigation` mock은 그대로 유지하고, 위 `ExploreGrid.test.tsx`와 같은 패턴(카테고리 섹션 헤딩 제거, 지역 탭 재요청 테스트 추가, 간략히 제거+완료 문구 추가, 끝에 이어붙임 검증)으로 고친다. `defaultQueryParams.regions`는 기존 그대로 `["HADONG"]` 하나만 쓰던 걸 유지해도 되지만, 지역 탭 전환 테스트를 넣으려면 최소 2개 지역(`["HADONG", "YEONGJU"]`)으로 바꾸고 관련된 `itineraryHref`/`conditionLine` 리터럴도 자연스럽게 맞춘다.

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `bun run test src/app/explore/_components/ExploreGrid.test.tsx src/app/contents/_components/ContentGrid.test.tsx`
Expected: FAIL (컴포넌트가 아직 `ContentBrowser`를 안 씀)

- [ ] **Step 3: 구현**

```tsx
// src/app/explore/_components/ExploreGrid.tsx 전체 교체
"use client";

import { ContentBrowser } from "@/components/ContentBrowser";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import type { Content } from "@/types/content";

import { ExploreCard } from "./ExploreCard";

interface ExploreGridProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
}

export function ExploreGrid({
  initialContents,
  initialTotal,
  queryParams,
}: ExploreGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[24px] bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] p-10 text-white">
        <p className="text-[11.5px] font-extrabold tracking-widest opacity-85 uppercase">
          Explore
        </p>
        <h1 className="mt-3 text-[34px] font-extrabold tracking-tight">
          경상도 소도시 콘텐츠 둘러보기
        </h1>
        <p className="mt-2.5 text-[15px] text-white/85">
          조건 없이 자유롭게 둘러보고, 마음에 들면 바로 담아두세요
        </p>
      </div>

      <ContentBrowser
        initialContents={initialContents}
        initialTotal={initialTotal}
        queryParams={queryParams}
        renderCard={(content) => <ExploreCard key={content.id} content={content} />}
        gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
}
```

```tsx
// src/app/contents/_components/ContentGrid.tsx 전체 교체
"use client";

import { BasketLayout } from "@/components/BasketLayout";
import { ContentBrowser } from "@/components/ContentBrowser";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import type { Content } from "@/types/content";

import { ContentCard } from "./ContentCard";

interface ContentGridProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
  itineraryHref: string;
  conditionLine: string;
}

export function ContentGrid({
  initialContents,
  initialTotal,
  queryParams,
  itineraryHref,
  conditionLine,
}: ContentGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-primary/70 uppercase">
          Step 2 · 콘텐츠 담기
        </p>
        <h1 className="mt-2.5 text-[32px] font-extrabold tracking-tight text-foreground">
          마음에 드는 콘텐츠를 담아보세요
        </h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          {conditionLine}
        </p>
      </div>

      <BasketLayout generateHref={itineraryHref}>
        <ContentBrowser
          initialContents={initialContents}
          initialTotal={initialTotal}
          queryParams={queryParams}
          renderCard={(content) => <ContentCard key={content.id} content={content} />}
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />
      </BasketLayout>
    </div>
  );
}
```

바구니가 비어있어도 계속 보여야 한다는 기존 테스트("콘텐츠 목록이 비어 있어도 이미 담아둔 바구니 항목은 계속 보여준다")는 `BasketLayout`이 `ContentBrowser`와 별도로 항상 렌더되므로 그대로 통과해야 한다.

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `bun run test src/app/explore/_components/ExploreGrid.test.tsx src/app/contents/_components/ContentGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/explore/_components/ExploreGrid.tsx src/app/explore/_components/ExploreGrid.test.tsx src/app/contents/_components/ContentGrid.tsx src/app/contents/_components/ContentGrid.test.tsx
git commit -m "refactor(contents,explore): 카테고리 섹션 그룹핑을 ContentBrowser 단일 그리드로 교체"
```

---

### Task 5: 카드에 지역 배지 (우상단, 반투명)

**Files:**
- Modify: `src/app/explore/_components/ExploreCard.tsx`
- Modify: `src/app/contents/_components/ContentCard.tsx`
- Test: `src/app/explore/_components/ExploreCard.test.tsx`
- Test: `src/app/contents/_components/ContentCard.test.tsx`

- [ ] **Step 1: 테스트 추가/수정**

`ExploreCard.test.tsx`에 추가:

```tsx
it("지역 라벨을 썸네일 우상단 배지로 렌더한다", () => {
  render(<ExploreCard content={stub} />);
  const badge = screen.getByText("하동");
  expect(badge).toHaveClass("bg-white/90");
});
```

`ContentCard.test.tsx`의 기존 "지역 배지를 카테고리 배지와 나란히 코랄 배경/흰 글씨로 렌더한다" 테스트를 아래로 교체:

```tsx
it("지역 배지를 썸네일 우상단에 반투명 배지로 렌더한다", () => {
  render(<ContentCard content={stub} />);

  const regionBadge = screen.getByText("하동");
  expect(regionBadge).toHaveClass("bg-white/90");
});
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `bun run test src/app/explore/_components/ExploreCard.test.tsx src/app/contents/_components/ContentCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: 구현**

`ExploreCard.tsx`의 thumb `<div>` 안, 카테고리 배지 다음에 추가(import에 `REGION_LABELS` 추가):

```tsx
import { REGION_LABELS } from "@/types/region";
// ...
<span className="absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-extrabold text-foreground shadow-sm backdrop-blur-sm">
  {REGION_LABELS[content.region]}
</span>
```

`ContentCard.tsx`는 기존 top-left `flex gap-1.5` 안에 있던 지역 배지 `<span>`을 제거하고, 카테고리 배지와 분리해 thumb에 우상단 배지로 추가:

```tsx
<div className="absolute top-2.5 left-2.5">
  {content.category && (
    <span className="rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-extrabold text-primary-foreground">
      {CATEGORY_LABELS[content.category]}
    </span>
  )}
</div>
<span className="absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-extrabold text-foreground shadow-sm backdrop-blur-sm">
  {REGION_LABELS[content.region]}
</span>
```

(`REGION_LABELS` import는 이미 있음)

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `bun run test src/app/explore/_components/ExploreCard.test.tsx src/app/contents/_components/ContentCard.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/explore/_components/ExploreCard.tsx src/app/explore/_components/ExploreCard.test.tsx src/app/contents/_components/ContentCard.tsx src/app/contents/_components/ContentCard.test.tsx
git commit -m "style(contents,explore): 지역 배지를 썸네일 우상단 반투명 스타일로 이동"
```

---

### Task 6: 전체 검증

- [ ] **Step 1: 전체 테스트 + lint**

Run: `bun run lint && bun run test`
Expected: 모두 PASS

- [ ] **Step 2: 개발 서버로 실제 확인**

`bun run dev` 실행 중인 상태에서 `/explore`, `/contents?regions=HADONG,YEONGJU,YECHEON&startDate=...&nights=1`에 접속해:
- 카테고리 섹션 없이 단일 그리드인지
- 지역 탭 클릭 시 그 지역만 다시 로드되는지(다른 지역 카드가 안 남는지)
- 카테고리 칩은 여전히 클라이언트 필터인지
- "더보기"가 끝에만 카드를 붙이는지, 다 불러오면 완료 문구가 뜨는지
- 카드 우상단에 지역 배지가 보이는지

- [ ] **Step 3: 커밋 없음(검증 전용) — 문제 발견 시 해당 태스크로 돌아가 수정**
