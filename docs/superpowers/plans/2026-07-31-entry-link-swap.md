# "콘텐츠 탐색"/"AI일정" 진입 링크 맞바꾸기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 헤더 nav와 홈페이지의 "콘텐츠 탐색" 진입점은 `/contents`(지역 카드 필터가 있는 콘텐츠 탐색 페이지)로, "AI일정" 진입점은 `/select/conditions`(여행조건 입력 Step 1)로 가도록 세 파일의 링크를 맞바꾼다.

**Architecture:** 순수 링크(href)와 nav 활성 판정 경로(matchPath) 변경. 새 컴포넌트나 라우트를 만들지 않고, `src/components/layout/Header.tsx`, `src/app/_components/HeroSection.tsx`, `src/app/_components/CtaSection.tsx`의 기존 `Link`/`NAV_ITEMS` 값만 수정한다.

**Tech Stack:** Next.js App Router, React 19, Vitest + React Testing Library.

## Global Constraints

- 두 진입점 모두 `ALL_REGIONS_QUERY`(`src/types/region.ts`, `"HADONG,YEONGJU,YECHEON"`)를 `regions` 쿼리로 그대로 사용한다 — 값 자체는 바꾸지 않는다.
- `/contents` 페이지가 `startDate` 없이 호출될 때의 동작은 이번 작업 범위 밖이다(사용자가 별도 페이지로 처리 예정) — 손대지 않는다.
- `/select/conditions`, `/contents`, `/itinerary` 페이지/로직 자체는 변경하지 않는다. 오직 진입 링크만 바꾼다.

---

### Task 1: `Header.tsx` nav 링크 맞바꾸기

**Files:**
- Modify: `src/components/layout/Header.tsx:10-18` (`NAV_ITEMS` 배열)
- Test: `src/components/layout/Header.test.tsx`

**Interfaces:**
- Consumes: `ALL_REGIONS_QUERY` (`src/types/region.ts`, 이미 import돼 있음), `isNavActive(pathname, matchPath)` (같은 파일 내 기존 함수, 변경 없음)
- Produces: 없음 (리프 컴포넌트)

- [ ] **Step 1: 실패하는 테스트로 먼저 갱신**

`src/components/layout/Header.test.tsx`의 기존 테스트 3개를 아래 내용으로 교체한다.

```tsx
  it("홈/콘텐츠 탐색/AI일정 네비게이션 링크를 올바른 href로 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "콘텐츠 탐색" })).toHaveAttribute(
      "href",
      "/contents?regions=HADONG,YEONGJU,YECHEON",
    );
    expect(screen.getByRole("link", { name: "AI일정" })).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });

  it("현재 경로와 일치하는 nav 항목만 활성 상태로 표시한다", () => {
    mockUsePathname.mockReturnValue("/select/conditions");
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "AI일정" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(
      screen.getByRole("link", { name: "콘텐츠 탐색" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("/contentsdetail 경로에서는 콘텐츠 탐색(/contents) 링크를 활성화하지 않는다", () => {
    mockUsePathname.mockReturnValue("/contentsdetail");
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(
      screen.getByRole("link", { name: "콘텐츠 탐색" }),
    ).not.toHaveAttribute("aria-current");
  });
```

이 세 테스트는 기존 파일의 77~136번째 줄에 있던 동일한 이름의(또는 유사한) `it` 블록 3개를 대체하는 것이다 — "로딩 상태", "비로그인 상태", "로그인 상태" 테스트(22~76번째 줄)는 그대로 둔다.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `bun run test src/components/layout/Header.test.tsx`
Expected: 위에서 바꾼 3개 테스트가 FAIL (현재 코드는 아직 `/select/conditions?regions=...`를 "콘텐츠 탐색"에, `/itinerary`를 "AI일정"에 매핑하고 있으므로 href/aria-current 단언이 어긋난다).

- [ ] **Step 3: `NAV_ITEMS` 수정**

`src/components/layout/Header.tsx:10-18`을 다음으로 교체한다.

```tsx
const NAV_ITEMS = [
  { href: "/", matchPath: "/", label: "홈" },
  {
    href: `/contents?regions=${ALL_REGIONS_QUERY}`,
    matchPath: "/contents",
    label: "콘텐츠 탐색",
  },
  {
    href: `/select/conditions?regions=${ALL_REGIONS_QUERY}`,
    matchPath: "/select/conditions",
    label: "AI일정",
  },
] as const;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test src/components/layout/Header.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/layout/Header.tsx src/components/layout/Header.test.tsx
git commit -m "feat(nav): 콘텐츠 탐색/AI일정 진입 링크를 맞바꿈"
```

---

### Task 2: `HeroSection.tsx` CTA 링크 맞바꾸기

**Files:**
- Modify: `src/app/_components/HeroSection.tsx:24,29`
- Test: `src/app/_components/HeroSection.test.tsx`

**Interfaces:**
- Consumes: `ALL_REGIONS_QUERY` (`src/types/region.ts`, 이미 import돼 있음)
- Produces: 없음

- [ ] **Step 1: 실패하는 테스트로 먼저 갱신**

`src/app/_components/HeroSection.test.tsx` 전체를 다음으로 교체한다.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  it("헤드라인과 콘텐츠 탐색/AI일정 CTA 링크를 보여준다", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("heading", { name: /하동, 영주, 예천/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "콘텐츠 둘러보기" }),
    ).toHaveAttribute("href", "/contents?regions=HADONG,YEONGJU,YECHEON");
    expect(
      screen.getByRole("link", { name: "AI 일정 살펴보기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `bun run test src/app/_components/HeroSection.test.tsx`
Expected: FAIL (href 단언 불일치)

- [ ] **Step 3: 링크 수정**

`src/app/_components/HeroSection.tsx`의 두 `Link`를 수정한다 (24번째 줄, 29번째 줄).

```tsx
          <Button asChild size="lg">
            <Link href={`/contents?regions=${ALL_REGIONS_QUERY}`}>
              콘텐츠 둘러보기
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}>
              AI 일정 살펴보기
            </Link>
          </Button>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test src/app/_components/HeroSection.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/_components/HeroSection.tsx src/app/_components/HeroSection.test.tsx
git commit -m "feat(home): Hero 섹션 콘텐츠 탐색/AI일정 링크를 맞바꿈"
```

---

### Task 3: `CtaSection.tsx` CTA 링크 맞바꾸기

**Files:**
- Modify: `src/app/_components/CtaSection.tsx:18,23`
- Test: `src/app/_components/CtaSection.test.tsx`

**Interfaces:**
- Consumes: `ALL_REGIONS_QUERY` (`src/types/region.ts`, 이미 import돼 있음)
- Produces: 없음

- [ ] **Step 1: 실패하는 테스트로 먼저 갱신**

`src/app/_components/CtaSection.test.tsx` 전체를 다음으로 교체한다.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaSection } from "./CtaSection";

describe("CtaSection", () => {
  it("콘텐츠 탐색/AI일정으로 이동하는 CTA 링크를 보여준다", () => {
    render(<CtaSection />);

    expect(
      screen.getByRole("link", { name: "콘텐츠부터 골라보기" }),
    ).toHaveAttribute("href", "/contents?regions=HADONG,YEONGJU,YECHEON");
    expect(
      screen.getByRole("link", { name: "AI 일정으로 바로가기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `bun run test src/app/_components/CtaSection.test.tsx`
Expected: FAIL (href 단언 불일치)

- [ ] **Step 3: 링크 수정**

`src/app/_components/CtaSection.tsx`의 두 `Link`를 수정한다 (18번째 줄, 23번째 줄).

```tsx
          <Button asChild size="lg">
            <Link href={`/contents?regions=${ALL_REGIONS_QUERY}`}>
              콘텐츠부터 골라보기
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}>
              AI 일정으로 바로가기
            </Link>
          </Button>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test src/app/_components/CtaSection.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/_components/CtaSection.tsx src/app/_components/CtaSection.test.tsx
git commit -m "feat(home): Cta 섹션 콘텐츠 탐색/AI일정 링크를 맞바꿈"
```

---

### Task 4: 전체 검증

**Files:** 없음 (검증 전용)

**Interfaces:** 없음

- [ ] **Step 1: 전체 테스트 실행**

Run: `bun run test`
Expected: 전체 테스트 스위트 PASS

- [ ] **Step 2: lint**

Run: `bun run lint`
Expected: 오류 없음

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: 빌드 성공
