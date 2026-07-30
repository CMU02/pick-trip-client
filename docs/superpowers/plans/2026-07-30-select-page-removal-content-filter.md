# 지역 선택 페이지 제거 및 콘텐츠 탐색 지역/카테고리 필터 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/select`(Step1 지역 선택) 페이지를 제거하고, `/contents` 페이지의 카테고리 필터 위에 지역 필터를 추가해 지역 선택 기능을 `/contents` 안으로 흡수한다.

**Architecture:** `/select/conditions`(Step2 날짜/기간)는 변경 없이 유지하고, `/select`(Step1)로 향하던 3개 진입 링크(Header, HeroSection, CtaSection)만 `/select/conditions?regions=HADONG,YEONGJU,YECHEON`(전체 지역 기본값)로 바꾼다. `/contents`의 `ContentFilter`/`ContentGrid`에는 기존 카테고리 필터와 완전히 동일한 클라이언트 사이드 토글 패턴으로 지역 필터를 추가한다. `RegionSelectGrid`가 담당하던 "새 여행 시작 시 바구니 초기화" 책임은 `TravelDateForm`으로 옮긴다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest + React Testing Library, Zustand(bakset store)

## Global Constraints

- 백엔드 `/api/v1/contents`는 region을 한 번에 하나만 받고 `startDate`/`nights`가 필수다(`src/services/contentService.ts`) — 이 계약과 `/select/conditions`의 UI/로직은 변경하지 않는다.
- 패키지 매니저는 Bun이다 — 검증은 `bun run lint`, `bun run test`, `bun run build`를 사용한다.
- 커밋 메시지는 `.agents/rules/git-convention.md` 형식(`<타입>(범위): 제목`, 한국어, 마침표 없음)을 따르고, 이슈 번호(#53)를 본문에 남긴다.
- 각 컴포넌트 변경은 `*.test.tsx`로 커버한다(`.agents/rules/test-convention.md`).
- Biome 포맷/린트를 통과해야 한다. `bun run format <파일...>`은 이번에 손댄 파일에만 적용한다(레포에 무관한 기존 CRLF 이슈가 있어 전체 포맷은 금지).

---

### Task 1: TravelDateForm 마운트 시 바구니 초기화

**Files:**
- Modify: `src/app/select/conditions/_components/TravelDateForm.tsx`
- Test: `src/app/select/conditions/_components/TravelDateForm.test.tsx`

**Interfaces:**
- Consumes: `useBasket()` from `@/hooks/useBasket` → `{ clear: () => void }` (이미 존재, `RegionSelectGrid.tsx`가 쓰던 것과 동일)
- Produces: 없음(내부 동작 추가만)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/select/conditions/_components/TravelDateForm.test.tsx` 최상단 import 블록을 아래로 교체(`beforeEach`, `useBasketStore`, `Content` 타입 추가):

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { useBasketStore } from "@/stores/basketStore";
import type { Content } from "@/types/content";

import { TravelDateForm } from "./TravelDateForm";

const stub: Content = {
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군",
  summary: "천년 고찰",
  indoor: false,
};

function fillDateAndDuration() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

describe("TravelDateForm — 바구니 초기화", () => {
  beforeEach(() => {
    localStorage.clear();
    useBasketStore.setState({ items: [], hydrated: false });
  });

  it("마운트 시 이전 여행 계획에서 남은 바구니를 비운다", () => {
    useBasketStore.setState({
      items: [{ content: stub, addedAt: Date.now(), priority: null }],
      hydrated: true,
    });

    render(<TravelDateForm regions="HADONG" />);

    expect(useBasketStore.getState().items).toHaveLength(0);
  });
});

describe("TravelDateForm — 동행 조건", () => {
```

기존 파일의 마지막 `});`(파일 끝, `동행 조건` describe를 닫는 괄호)는 그대로 둔다 — 새 `describe` 블록 하나를 앞에 추가하는 것뿐이다. 기존 4개 `it(...)` 테스트 케이스 본문은 그대로 유지한다.

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `bun run test src/app/select/conditions/_components/TravelDateForm.test.tsx`
Expected: `TravelDateForm — 바구니 초기화 > 마운트 시 이전 여행 계획에서 남은 바구니를 비운다` FAIL (items가 여전히 1개)

- [ ] **Step 3: 최소 구현**

`src/app/select/conditions/_components/TravelDateForm.tsx`의 import 블록을 아래로 교체:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useBasket } from "@/hooks/useBasket";
import {
  type CompanionCondition,
  DURATION_PRESETS,
  type TravelDuration,
} from "@/types/travel-condition";

import { CompanionSelector } from "./CompanionSelector";
import { DurationSelector } from "./DurationSelector";
import { StartDateInput } from "./StartDateInput";
```

컴포넌트 본문 맨 위, `const router = useRouter();` 바로 다음 줄에 추가:

```tsx
  const { clear } = useBasket();

  // Step2(여행 조건 입력)가 새 여행 계획의 실질적 시작점이므로, 이전 계획에서
  // 남은 바구니를 비운다. 원래 이 책임은 /select(Step1)에 있었으나 해당
  // 페이지가 제거되며 이곳으로 옮겨왔다.
  useEffect(() => {
    clear();
  }, [clear]);
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `bun run test src/app/select/conditions/_components/TravelDateForm.test.tsx`
Expected: 5개 테스트 모두 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/select/conditions/_components/TravelDateForm.tsx src/app/select/conditions/_components/TravelDateForm.test.tsx
git commit -m "feat(select): 여행 조건 입력 진입 시 이전 바구니를 초기화

/select(Step1)가 담당하던 '새 여행 계획 시작 시 바구니 비우기' 책임을
여행 조건 입력(Step2, TravelDateForm)으로 옮겼다. Step1이 곧 제거되며
Step2가 실질적인 여행 계획 시작점이 되기 때문이다.

이슈: #53"
```

---

### Task 2: `/select`(Step1) 페이지 제거

**Files:**
- Delete: `src/app/select/page.tsx`
- Delete: `src/app/select/_components/RegionSelectGrid.tsx`
- Delete: `src/app/select/_components/RegionSelectGrid.test.tsx`
- Delete: `src/app/select/_components/RegionCard.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (다른 파일이 이 파일들을 import하지 않음 — Header/HeroSection/CtaSection은 `/select`를 문자열 경로로만 참조했을 뿐 이 컴포넌트들을 import하지 않았음, 이번 계획 작성 시 확인 완료)

- [ ] **Step 1: 삭제 대상 외 다른 곳에서 참조하지 않는지 확인**

Run: `grep -rn "RegionSelectGrid\|RegionCard" src --include=*.tsx -l`
Expected: `src/app/select/page.tsx`, `src/app/select/_components/RegionSelectGrid.tsx`, `src/app/select/_components/RegionSelectGrid.test.tsx`만 출력됨(삭제 대상 파일들 자기 자신). 다른 경로가 나오면 삭제 전에 먼저 그 참조를 처리해야 하므로 중단하고 확인한다.

- [ ] **Step 2: 파일 삭제**

```bash
rm src/app/select/page.tsx
rm src/app/select/_components/RegionSelectGrid.tsx
rm src/app/select/_components/RegionSelectGrid.test.tsx
rm src/app/select/_components/RegionCard.tsx
```

- [ ] **Step 3: 남은 테스트가 정상 통과하는지 확인**

Run: `bun run test`
Expected: 삭제된 파일의 테스트가 스위트에서 사라지고, 나머지 전체 테스트는 PASS (Header/HeroSection/CtaSection 테스트는 아직 `/select` href를 기대하므로 이 시점엔 그대로 통과 — 링크 변경은 Task 4에서 처리)

- [ ] **Step 4: 빌드로 죽은 라우트 참조가 없는지 확인**

Run: `bun run build`
Expected: 빌드 성공, Route 목록에서 `/select`(정확히 이 경로, `/select/conditions`는 남아있어야 함)가 더 이상 나타나지 않음

- [ ] **Step 5: 커밋**

```bash
git add -A src/app/select
git commit -m "feat(select): 지역 선택(Step1) 페이지 제거

지역 선택 기능을 /contents 페이지의 지역 필터로 대체하기로 하여
/select 라우트와 관련 컴포넌트(RegionSelectGrid, RegionCard)를 제거했다.
/select/conditions(Step2 여행 조건 입력)는 그대로 유지한다.

이슈: #53"
```

---

### Task 3: `ContentFilter`에 지역 버튼 추가

**Files:**
- Modify: `src/app/contents/_components/ContentFilter.tsx`
- Test: `src/app/contents/_components/ContentFilter.test.tsx`

**Interfaces:**
- Consumes: `REGIONS: readonly Region[]`, `REGION_LABELS: Record<Region, string>`, `type Region` from `@/types/region` (기존 존재)
- Produces: `ContentFilter` 컴포넌트의 새 필수 props `selectedRegions: Region[]`, `onRegionChange: (regions: Region[]) => void` — Task 4의 `ContentGrid`가 이 props를 채워 넘긴다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/contents/_components/ContentFilter.test.tsx` 전체를 아래로 교체:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContentFilter } from "./ContentFilter";

describe("ContentFilter", () => {
  it("3개 지역 칩과 6개 카테고리 칩을 렌더한다", () => {
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    for (const label of ["하동", "영주", "예천"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    for (const label of ["음식", "축제", "관광지", "문화", "자연", "체험"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("지역 칩 클릭 시 onRegionChange를 호출한다", async () => {
    const onRegionChange = vi.fn();
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={onRegionChange}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "하동" }));

    expect(onRegionChange).toHaveBeenCalledWith(["HADONG"]);
  });

  it("선택된 지역 칩은 aria-pressed=true 속성을 갖는다", () => {
    render(
      <ContentFilter
        selectedRegions={["HADONG"]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "하동" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "영주" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("카테고리 칩 클릭 시 onCategoryChange를 호출한다", async () => {
    const onCategoryChange = vi.fn();
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={onCategoryChange}
        onKeywordChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "음식" }));

    expect(onCategoryChange).toHaveBeenCalledWith(["FOOD"]);
  });

  it("선택된 카테고리 칩은 aria-pressed=true 속성을 갖는다", () => {
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={["FOOD"]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

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
    const onKeywordChange = vi.fn();
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={onKeywordChange}
      />,
    );

    await userEvent.type(screen.getByRole("searchbox"), "쌍");

    expect(onKeywordChange).toHaveBeenLastCalledWith("쌍");
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `bun run test src/app/contents/_components/ContentFilter.test.tsx`
Expected: FAIL — `selectedRegions`/`onRegionChange` prop이 없어 타입 에러 또는 "하동" 버튼을 찾지 못함

- [ ] **Step 3: 최소 구현**

`src/app/contents/_components/ContentFilter.tsx` 전체를 아래로 교체:

```tsx
"use client";

import {
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type ContentCategory,
} from "@/types/content";
import { REGION_LABELS, REGIONS, type Region } from "@/types/region";

interface ContentFilterProps {
  selectedRegions: Region[];
  selectedCategories: ContentCategory[];
  keyword: string;
  onRegionChange: (regions: Region[]) => void;
  onCategoryChange: (categories: ContentCategory[]) => void;
  onKeywordChange: (keyword: string) => void;
}

export function ContentFilter({
  selectedRegions,
  selectedCategories,
  keyword,
  onRegionChange,
  onCategoryChange,
  onKeywordChange,
}: ContentFilterProps) {
  function toggleRegion(region: Region) {
    if (selectedRegions.includes(region)) {
      onRegionChange(selectedRegions.filter((r) => r !== region));
    } else {
      onRegionChange([...selectedRegions, region]);
    }
  }

  function toggleCategory(category: ContentCategory) {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => {
          const selected = selectedRegions.includes(region);
          return (
            <button
              key={region}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleRegion(region)}
              className={
                selected
                  ? "rounded-full border border-primary bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40"
              }
            >
              {REGION_LABELS[region]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_CATEGORIES.map((category) => {
          const selected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleCategory(category)}
              className={
                selected
                  ? "rounded-full border border-primary bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40"
              }
            >
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      <input
        type="search"
        placeholder="콘텐츠 검색"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `bun run test src/app/contents/_components/ContentFilter.test.tsx`
Expected: 6개 테스트 모두 PASS

주의: 이 시점에서 `bun run test`(전체)를 돌리면 `ContentGrid.tsx`가 아직 `ContentFilter`에 `selectedRegions`/`onRegionChange`를 넘기지 않아 타입 에러 또는 `ContentGrid.test.tsx` 실패가 날 수 있다. 이는 Task 4에서 해결되므로 이 Task는 `ContentFilter.test.tsx` 단독 실행 결과만 확인하고 넘어간다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/contents/_components/ContentFilter.tsx src/app/contents/_components/ContentFilter.test.tsx
git commit -m "feat(contents): 콘텐츠 필터에 지역 버튼 추가

카테고리 버튼 위에 지역(하동/영주/예천) 토글 버튼을 추가했다.
기존 카테고리 버튼과 동일한 스타일/aria-pressed 패턴을 그대로 따른다.

이슈: #53"
```

---

### Task 4: `ContentGrid`에 지역 필터링 로직 추가

**Files:**
- Modify: `src/app/contents/_components/ContentGrid.tsx`
- Test: `src/app/contents/_components/ContentGrid.test.tsx`

**Interfaces:**
- Consumes: Task 3에서 만든 `ContentFilter`의 `selectedRegions`/`onRegionChange` props, `Content.region: Region`(기존 필드)
- Produces: 없음 (라우트 최상위 컴포넌트)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/contents/_components/ContentGrid.test.tsx`에서 `makeContent` 아래, `describe("ContentGrid", () => {` 블록 안 첫 `it(...)` 앞에 아래 두 테스트를 추가:

```tsx
  it("지역 필터 선택 시 해당 지역 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", region: "HADONG" }),
      makeContent({ id: "2", name: "부석사", region: "YEONGJU" }),
    ];

    render(
      <ContentGrid
        initialContents={contents}
        itineraryHref={defaultItineraryHref}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "하동" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

  it("지역 필터와 카테고리 필터를 동시에 적용하면 두 조건을 모두 만족하는 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({
        id: "1",
        name: "쌍계사",
        region: "HADONG",
        category: "CULTURE",
      }),
      makeContent({
        id: "2",
        name: "하동 재첩국",
        region: "HADONG",
        category: "FOOD",
      }),
      makeContent({
        id: "3",
        name: "부석사",
        region: "YEONGJU",
        category: "CULTURE",
      }),
    ];

    render(
      <ContentGrid
        initialContents={contents}
        itineraryHref={defaultItineraryHref}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "하동" }));
    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `bun run test src/app/contents/_components/ContentGrid.test.tsx`
Expected: 새로 추가한 2개 테스트 FAIL ("하동" 버튼 클릭해도 부석사가 그대로 보임 — 아직 region 필터링 로직이 없음)

- [ ] **Step 3: 최소 구현**

`src/app/contents/_components/ContentGrid.tsx`의 import 블록에 `Region` 타입 추가:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useBasket } from "@/hooks/useBasket";
import {
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type Content,
  type ContentCategory,
} from "@/types/content";
import type { Region } from "@/types/region";

import { BasketDrawer } from "./BasketDrawer";
import { BasketFab } from "./BasketFab";
import { BasketPanel } from "./BasketPanel";
import { ContentCard } from "./ContentCard";
import { ContentFilter } from "./ContentFilter";
```

`export function ContentGrid(...)` 본문 상단의 상태 선언부를 아래로 교체:

```tsx
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");
```

`filtered` 계산 블록을 아래로 교체:

```tsx
  const filtered = initialContents.filter((c) => {
    const matchRegion =
      selectedRegions.length === 0 || selectedRegions.includes(c.region);
    const matchCategory =
      selectedCategories.length === 0 ||
      (c.category !== undefined && selectedCategories.includes(c.category));
    const q = keyword.trim().toLowerCase();
    const matchKeyword =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    return matchRegion && matchCategory && matchKeyword;
  });
```

`<ContentFilter ... />` 호출부를 아래로 교체:

```tsx
            <ContentFilter
              selectedRegions={selectedRegions}
              selectedCategories={selectedCategories}
              keyword={keyword}
              onRegionChange={setSelectedRegions}
              onCategoryChange={setSelectedCategories}
              onKeywordChange={setKeyword}
            />
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `bun run test src/app/contents/_components/ContentGrid.test.tsx`
Expected: 기존 테스트 포함 전체 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/contents/_components/ContentGrid.tsx src/app/contents/_components/ContentGrid.test.tsx
git commit -m "feat(contents): 콘텐츠 그리드에 지역 필터링 로직 추가

Content.region 필드를 이용해 카테고리 필터와 동일한 클라이언트 사이드
패턴으로 지역 필터를 적용했다. 지역/카테고리 필터는 서로 독립적으로
함께(AND 조건) 적용된다.

이슈: #53"
```

---

### Task 5: 콘텐츠 탐색 진입 링크를 `/select/conditions`로 변경

**Files:**
- Modify: `src/types/region.ts`
- Modify: `src/components/layout/Header.tsx`
- Test: `src/components/layout/Header.test.tsx`
- Modify: `src/app/_components/HeroSection.tsx`
- Test: `src/app/_components/HeroSection.test.tsx`
- Modify: `src/app/_components/CtaSection.tsx`
- Test: `src/app/_components/CtaSection.test.tsx`

**Interfaces:**
- Produces: `ALL_REGIONS_QUERY: string` (export from `@/types/region`) — `"HADONG,YEONGJU,YECHEON"`, Header/HeroSection/CtaSection이 공통으로 소비

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/layout/Header.test.tsx`에서 href 검증 부분을 아래로 교체(`"콘텐츠 탐색"` 관련 두 곳):

```tsx
    expect(
      screen.getByRole("link", { name: "콘텐츠 탐색" }),
    ).toHaveAttribute("href", "/select/conditions?regions=HADONG,YEONGJU,YECHEON");
```

(nav 링크 href 테스트와, active-state 테스트에서는 href 검증이 없으므로 그대로 둔다 — `mockUsePathname.mockReturnValue("/select/conditions")`로 이미 경로만 비교하고 있어 변경 불필요.)

`src/app/_components/HeroSection.test.tsx`의 href 기대값을 교체:

```tsx
    expect(
      screen.getByRole("link", { name: "콘텐츠 둘러보기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
```

`src/app/_components/CtaSection.test.tsx`의 href 기대값을 교체:

```tsx
    expect(
      screen.getByRole("link", { name: "콘텐츠부터 골라보기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `bun run test src/components/layout/Header.test.tsx src/app/_components/HeroSection.test.tsx src/app/_components/CtaSection.test.tsx`
Expected: 3개 테스트 FAIL (여전히 `href="/select"`)

- [ ] **Step 3: 최소 구현**

`src/types/region.ts` 맨 아래에 추가:

```ts
export const ALL_REGIONS_QUERY = REGIONS.join(",");
```

`src/components/layout/Header.tsx`의 import와 `NAV_ITEMS`/`isNavActive`를 아래로 교체:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ALL_REGIONS_QUERY } from "@/types/region";

const NAV_ITEMS = [
  { href: "/", matchPath: "/", label: "홈" },
  {
    href: `/select/conditions?regions=${ALL_REGIONS_QUERY}`,
    matchPath: "/select/conditions",
    label: "콘텐츠 탐색",
  },
  { href: "/itinerary", matchPath: "/itinerary", label: "AI일정" },
] as const;

function isNavActive(pathname: string, matchPath: string) {
  if (matchPath === "/") return pathname === "/";
  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}
```

`NAV_ITEMS.map` 콜백 안의 `isNavActive` 호출부를 `matchPath` 기준으로 교체:

```tsx
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.matchPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
```

주의: `href`는 쿼리스트링을 포함한 전체 경로, `matchPath`는 경로만(쿼리 없음)이다. `usePathname()`은 쿼리스트링을 포함하지 않으므로 active 판별은 반드시 `matchPath`로 해야 한다 — `href`로 비교하면 "콘텐츠 탐색"이 절대 active 상태가 되지 않는 버그가 생긴다.

`src/app/_components/HeroSection.tsx`: import에 `ALL_REGIONS_QUERY` 추가하고 `href="/select"`를 교체:

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ALL_REGIONS_QUERY } from "@/types/region";
```

```tsx
          <Button asChild size="lg">
            <Link href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}>
              콘텐츠 둘러보기
            </Link>
          </Button>
```

`src/app/_components/CtaSection.tsx`: 동일한 import 추가 후 `href="/select"`를 교체:

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ALL_REGIONS_QUERY } from "@/types/region";
```

```tsx
          <Button asChild size="lg">
            <Link href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}>
              콘텐츠부터 골라보기
            </Link>
          </Button>
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `bun run test`
Expected: 전체 테스트 스위트 PASS (Header/HeroSection/CtaSection 포함, Task 1~4에서 추가한 테스트 모두 포함)

- [ ] **Step 5: 커밋**

```bash
git add src/types/region.ts src/components/layout/Header.tsx src/components/layout/Header.test.tsx src/app/_components/HeroSection.tsx src/app/_components/HeroSection.test.tsx src/app/_components/CtaSection.tsx src/app/_components/CtaSection.test.tsx
git commit -m "feat(nav): 콘텐츠 탐색 진입 링크를 /select/conditions로 변경

/select(Step1) 제거에 따라 헤더 네비게이션과 홈페이지 CTA(히어로, 하단
CTA 섹션)의 '콘텐츠 탐색' 진입 링크를 /select/conditions?regions=전체지역
으로 바꿨다. 헤더의 active 상태 판별은 쿼리스트링이 없는 matchPath 기준으로
분리해 usePathname()과 정확히 비교되도록 했다.

이슈: #53"
```

---

### Task 6: 전체 검증

**Files:** 없음(검증 전용)

**Interfaces:** 없음

- [ ] **Step 1: Lint**

Run: `bun run lint`
Expected: 이번 작업에서 수정한 파일 기준으로 에러 없음(레포에 이미 존재하던 무관한 CRLF 이슈는 무시)

- [ ] **Step 2: 전체 테스트**

Run: `bun run test`
Expected: 전체 PASS

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: 성공, Route 목록에 `/select`가 없고 `/select/conditions`, `/contents`, `/itinerary`는 있음

- [ ] **Step 4: 브라우저 수동 확인**

Run: `bun run dev` (이미 다른 포트에서 실행 중이면 해당 URL 사용)

확인 항목:
- `/`에서 헤더 "콘텐츠 탐색" 클릭 → `/select/conditions?regions=HADONG,YEONGJU,YECHEON`로 이동하고 Step2 폼이 정상 표시되는지
- 날짜/기간 입력 후 "다음" 클릭 → `/contents?regions=HADONG,YEONGJU,YECHEON&...`로 이동하고 3개 지역 콘텐츠가 함께 표시되는지
- `/contents`에서 지역 버튼(하동/영주/예천) 클릭 시 해당 지역 콘텐츠만 남는지, 카테고리 버튼과 함께 눌렀을 때 교집합으로 좁혀지는지
- 홈페이지 지역 카드(하동/영주/예천) 클릭은 기존처럼 단일 지역으로 `/select/conditions?regions=HADONG` 등으로 이동하는지(변경 없음 확인)
- `/select` 직접 접속 시 404가 뜨는지(라우트 삭제 확인)

- [ ] **Step 5: 남은 변경사항 확인**

Run: `git status`
Expected: `nothing to commit, working tree clean` (Task 1~5에서 이미 모두 커밋됨)

---

## Self-Review 결과

- **스펙 커버리지**: `/select` 삭제(Task 2), Step2 유지(Task 1·건드리지 않음 확인), 바구니 초기화 이관(Task 1), 지역 필터 UI(Task 3), 지역 필터 로직(Task 4), 진입 링크 3곳 변경(Task 5), 테스트 전부(각 Task에 포함) — 스펙의 모든 섹션에 대응하는 Task 존재.
- **Placeholder 스캔**: "TODO"/"나중에"/"적절히 처리" 등 표현 없음, 모든 Step에 실제 코드 포함.
- **타입 일관성**: `ContentFilter`의 `selectedRegions`/`onRegionChange` (Task 3) ↔ `ContentGrid`의 `setSelectedRegions`/`selectedRegions` (Task 4) 시그니처 일치 확인. `ALL_REGIONS_QUERY: string` (Task 5, region.ts) ↔ Header/HeroSection/CtaSection에서의 사용 방식 일치 확인. `isNavActive(pathname, matchPath)` 시그니처와 호출부 일치 확인.
