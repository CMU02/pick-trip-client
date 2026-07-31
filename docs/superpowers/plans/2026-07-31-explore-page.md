# `/explore` 페이지 신설 — 담기 없는 순수 콘텐츠 탐색 페이지

## Context

지금 "콘텐츠 탐색" 버튼(헤더 nav, HeroSection "콘텐츠 둘러보기", CtaSection "콘텐츠부터 골라보기")은 `/contents?regions=...`로 연결된다. `/contents`는 원래 AI 일정 생성 흐름(`/select/conditions` → `/contents` → `/itinerary`)의 한 단계로, 바구니에 콘텐츠를 담는 기능이 핵심이다.

사용자는 "콘텐츠 탐색" 버튼의 목적지를 완전히 새로운 페이지 `/explore`로 바꾸고 싶어한다. 이 페이지는 `/contents`와 레이아웃(지역/카테고리 필터 + 카테고리별 카드 그리드)은 동일하지만, 바구니 개념 자체가 없는 순수 열람 페이지다 — 각 카드의 "담기" 버튼이 "상세 설명" 버튼으로 바뀌고, 클릭하면 이미 존재하는 콘텐츠 상세 페이지(`/contents/[id]`)로 이동한다. `/contents`는 AI 일정 흐름용으로 그대로 유지된다.

날짜 처리: `/contents`가 백엔드 조회 시 요구하는 `startDate`/`nights`는, 사용자가 확정한 대로, 오늘 날짜와 `nights=0`을 그냥 채워 넣는 플레이스홀더로 처리한다(이 페이지엔 여행 날짜 개념이 없으므로 정확성이 중요하지 않음).

## 재사용할 기존 코드

- `src/app/contents/page.tsx`의 `getContents` 호출/에러 처리 패턴, `<main className="mx-auto w-full max-w-7xl px-4 py-10">` 셸
- `src/app/contents/_components/ContentGrid.tsx`의 필터링 로직·그룹 렌더링 구조 (바구니 관련 부분만 제거)
- `src/app/contents/_components/ContentCard.tsx`의 카드 마크업 (이미지/제목/배지/주소/요약, `/contents/${id}` 링크는 그대로 유지)
- `src/app/contents/_components/ContentFilter.tsx` — 바구니와 무관한 순수 필터 UI라 그대로 공유
- 이미 완성돼 있는 `/contents/[id]` 상세 페이지(`ContentDetailView`) — 새 라우트 불필요, 그대로 링크 대상으로 사용
- `Button asChild` + `Link` 패턴 (`Header.tsx`, `HeroSection.tsx`에서 이미 사용 중)
- `src/app/select/conditions/_components/StartDateInput.tsx`의 오늘 날짜 계산 방식(`new Date().toISOString().split("T")[0]`)

## 변경 사항

### 1. 공유 유틸 추출 — `src/lib/content.ts` (신규)

`ContentGrid.tsx`에 있는 `groupByCategory` 함수(+ `ContentGroup` 인터페이스)를 `src/lib/content.ts`로 옮겨 `groupContentsByCategory`로 export한다. `/contents`와 `/explore` 양쪽이 카테고리 그룹 순서를 똑같이 유지해야 하므로 공유가 맞다. `ContentGrid.tsx`는 로컬 정의를 지우고 이 함수를 import해서 쓰도록 고친다(이때 `CATEGORY_LABELS`/`CONTENT_CATEGORIES`가 `ContentGrid.tsx`에서 더 이상 안 쓰이면 import에서 제거).

`src/lib/content.test.ts`를 새로 작성해 그룹 순서, 빈 카테고리 제외, "기타" 그룹 처리를 검증한다.

### 2. `ContentFilter`를 공유 위치로 이동

`src/app/contents/_components/ContentFilter.tsx`와 `ContentFilter.test.tsx`를 `src/components/ContentFilter.tsx` / `ContentFilter.test.tsx`로 이동한다(`.agents/rules/file-structure.md`: "공유가 확실해진 컴포넌트만 src/components로 이동"). 내용은 그대로, `ContentGrid.tsx`의 import만 `@/components/ContentFilter`로 바꾼다.

### 3. 새 라우트 `src/app/explore/`

- `src/app/explore/page.tsx`: searchParams 없이, `getContents({ regions: [...REGIONS], startDate: 오늘날짜, nights: 0 })` 호출. 에러 처리는 `/contents/page.tsx`와 동일한 메시지("콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."). `<ExploreGrid initialContents={contents} />` 렌더.
  - 주의: `REGIONS`는 `as const` 배열(`readonly` 타입)이라 `getContents`가 요구하는 `string[]`에 바로 대입이 안 된다. `[...REGIONS]`로 풀어서 넘긴다.
- `src/app/explore/_components/ExploreGrid.tsx`: `ContentGrid.tsx`를 기반으로 하되 `useBasket`, `BasketPanel`/`BasketDrawer`/`BasketFab`, `useRouter`, `itineraryHref`를 전부 제거. props는 `{ initialContents: Content[] }`만 받는다. 바구니 사이드바(`flex gap-6` + `aside`)가 없으니 레이아웃은 `<div className="flex flex-col gap-6">`로 단순화(필터 + 결과 그리드만, 전체 너비 사용). `ContentFilter`는 `@/components/ContentFilter`에서, 그룹핑은 `@/lib/content`의 `groupContentsByCategory`에서 가져온다. 지역/카테고리/키워드 필터링 로직과 빈 상태 문구는 `ContentGrid.tsx`와 동일하게 유지.
- `src/app/explore/_components/ExploreCard.tsx`: `ContentCard.tsx`를 기반으로 하되 props는 `{ content: Content }`만 받는다(`isInBasket`/`onToggleBasket` 제거). 이미지/제목/배지/주소/요약을 감싸는 `<Link href={`/contents/${content.id}`}>`는 그대로 유지. 하단 버튼만 교체:
  ```tsx
  <Button asChild variant="outline" size="sm" className="mt-1 w-full">
    <Link href={`/contents/${content.id}`}>상세 설명</Link>
  </Button>
  ```
  아이콘은 넣지 않는다 — `src/components/ui/icon.tsx`에 정의된 아이콘(`bookmark`/`check`/`plus`/`trash`/`close`/`wand`) 중 "상세 설명"에 맞는 게 없고, 새 아이콘 추가는 이번 범위 밖이다.

각 컴포넌트는 기존 `ContentGrid.test.tsx`/`ContentCard.test.tsx`와 동일한 케이스를 미러링해서 먼저 작성한다(지역/카테고리/키워드 필터, 빈 상태, 카테고리 그룹핑; 카드 쪽은 이름/카테고리/주소/요약 렌더 + "상세 설명" 링크가 `/contents/{id}`를 가리키는지).

### 4. 진입 링크 3곳 변경

- `src/components/layout/Header.tsx`: `NAV_ITEMS`의 "콘텐츠 탐색" 항목만 `href: "/explore"`, `matchPath: "/explore"`로 변경. "AI일정" 항목(`ALL_REGIONS_QUERY` 사용)은 그대로 둔다 — import도 계속 쓰이므로 그대로 둔다.
- `src/app/_components/HeroSection.tsx`: "콘텐츠 둘러보기" 링크를 `<Link href="/explore">`로 변경. "AI 일정 살펴보기"는 그대로.
- `src/app/_components/CtaSection.tsx`: "콘텐츠부터 골라보기" 링크를 `<Link href="/explore">`로 변경. "AI 일정으로 바로가기"는 그대로.

세 파일 모두 `ALL_REGIONS_QUERY` import는 "AI일정" 계열 링크가 계속 쓰므로 지우지 않는다.

### 5. 테스트 갱신

- `Header.test.tsx`: "콘텐츠 탐색" href 기대값을 `/explore`로 수정. `isNavActive`의 prefix-매칭 경계를 검증하던 `/itineraries`류 테스트를 `/exploredetail` 경로로 바꿔 같은 회귀를 계속 검증한다.
- `HeroSection.test.tsx`, `CtaSection.test.tsx`: 각각 "콘텐츠 둘러보기"/"콘텐츠부터 골라보기" href 기대값을 `/explore`로 수정.

## 참고 — 기존에 이미 있던 lint 이슈

`bun run lint`는 이 작업과 무관한 9개 파일(CRLF 줄바꿈 차이 — `vitest.setup.ts`, `src/types/*.ts` 등)에서 이미 실패 중이다(이전 세션에서 확인). 이번 변경 파일들은 여기 포함되지 않으니, lint 결과가 "기존과 동일한 9건"인지만 확인하면 된다 — 레포 전체 포맷(`bun run format` 전체 실행)은 하지 않는다.

## 검증

```bash
bun run test    # src/lib/content.test.ts, ExploreGrid/ExploreCard 테스트, 이동된 ContentFilter.test.tsx, 갱신된 Header/Hero/Cta 테스트 포함 전체 통과
bun run lint    # 기존 9건 CRLF 오류 외에 새로 추가된 오류 없어야 함
bun run build   # /explore 라우트 타입체크 및 빌드 성공 (특히 [...REGIONS] 타입 확인)
```

추가로 `bun run dev`로 `/explore` 접속해 지역/카테고리 필터, "상세 설명" 버튼 클릭 시 `/contents/[id]`로 이동하는지 수동 확인.
