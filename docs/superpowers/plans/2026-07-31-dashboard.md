# 로그인 후 대시보드(/dashboard) 신설

## Context

지금은 로그인 여부와 상관없이 헤더 nav(홈/콘텐츠 탐색/AI일정)와 홈 화면(`/`)이 동일하다. 사용자는 로그인한 사용자에게는 완전히 다른 경험을 주고 싶어한다 — 헤더에서 기존 nav 3개를 없애고 "대시보드" 링크 하나만 남기고, `/dashboard`라는 새 페이지에서 인사말+진행 스텝퍼, 내 여행 목록, 추천 콘텐츠(FOR YOU), 최근 본 콘텐츠(RECENT)를 보여준다. 로그인 상태로 `/`에 접속하면 `/dashboard`로 리다이렉트한다.

조사 결과 이 기능에 필요한 데이터 중 상당수가 현재 백엔드/코드에 존재하지 않는다:
- **추천(FOR YOU) API 없음** — 기존 `getContents`로 콘텐츠 풀을 가져와 클라이언트에서 간단히 골라내는 방식으로 대체한다(진짜 개인화 추천 아님, 사용자가 승인함).
- **최근 본 콘텐츠 추적 없음** — 새 localStorage 스토어로 처음부터 만든다.
- **찜(favorite) 기능 없음** — FOR YOU 카드에 실제 동작하는 찜 기능을 새 localStorage 스토어로 만든다(사용자가 "진짜 기능으로 함께 만든다" 선택).
- **서버 측 "내 저장 일정 전체 목록" API 없음** — 기존 `/itineraries`처럼 브라우저 localStorage(`useSavedItineraries`)에 저장된 목록을 그대로 쓴다.

## 사용자가 확정한 결정 사항

- 로그인 후 헤더: 로고/유저메뉴는 유지, 홈/콘텐츠 탐색/AI일정 nav는 사라지고 "대시보드" 링크 하나만 표시.
- 라우트: `/dashboard`. 로그인 상태로 `/`에 접속하면 `/dashboard`로 리다이렉트(반대로 비로그인 상태로 `/dashboard`에 접속하면 `/`로 리다이렉트).
- 진행 스텝퍼(①지역 선택→②콘텐츠 담기→③일정 완성) 상태는 바구니/저장된 일정으로 자동 판단:
  - 바구니 0개 → ①진행중, ②③예정
  - 바구니 1개 → ①완료, ②진행중, ③예정
  - 바구니 2개 이상(일정 생성 가능 기준과 동일) & 저장된 일정 0개 → ①②완료, ③진행중
  - 저장된 일정 1개 이상 → ①②③ 모두 완료
- "내 여행" 섹션은 대시보드에 최근 N개(6개, 3열×2행)만 미리보기, 전체는 "더보기 →" 클릭 시 기존 `/itineraries`로 이동.
- 여행 카드 케밥 메뉴: 상세보기(인라인 펼침, 기존 `SavedItinerariesList`와 동일하게 `getItinerary` 호출 후 `ItineraryResult` 렌더) / 공유하기(인라인으로 기존 `ShareButton` 토글) / 삭제(`useSavedItineraries().remove`).
- FOR YOU 카드 상단 배지는 여행기간이 아니라 콘텐츠 카테고리(음식/관광지/문화 등, 기존 `CATEGORY_LABELS`/`CATEGORY_BADGE_CLASSES` 재사용).
- FOR YOU 카드의 찜 아이콘은 새 localStorage 스토어(`useFavorites`)로 실제 동작.

## 재사용할 기존 코드 / 패턴

- `src/hooks/useAuth.tsx` — `status`("loading"/"authenticated"/"unauthenticated"), `user.nickname`, `user.profileImageUrl`
- `src/hooks/useBasket.ts` / `src/stores/basketStore.ts` — Zustand + localStorage 패턴(그대로 새 스토어 2개에 미러링)
- `src/hooks/useSavedItineraries.ts` / `src/stores/savedItinerariesStore.ts`
- `src/app/itineraries/_components/SavedItinerariesList.tsx` — 인라인 펼침(상세보기) fetch 패턴, `formatDuration` 헬퍼(공유 위치로 추출 예정)
- `src/app/itinerary/_components/ShareButton.tsx` — 공유 링크 생성/복사 UI, `itineraryId` prop만 받음
- `src/app/itinerary/_components/ItineraryResult.tsx` — `{ data: { days: Day[] } }` prop
- `src/services/itineraryService.ts`의 `getItinerary(itineraryId)`
- `src/services/contentService.ts`의 `getContents` — `/explore/page.tsx`와 동일하게 `regions: [...REGIONS]`, `startDate: 오늘`, `nights: 0`으로 호출
- `src/types/content.ts`의 `CATEGORY_LABELS`/`CATEGORY_BADGE_CLASSES`
- `src/components/ui/button.tsx`(`asChild`, `variant="destructive"` 등), `src/components/ui/card.tsx`(Card/CardHeader/CardContent 등, 지금까지 미사용이었으나 배너 카드에 첫 사용)
- `radix-ui` 패키지(이미 의존성 있음, `Slot`을 이미 `Button`에서 사용 중) — `DropdownMenu` 네임스페이스로 케밥 메뉴 프리미티브를 새로 만든다.
- `src/app/contents/[id]/_components/ContentDetailView.tsx` — 최근 본 콘텐츠 기록 지점(이미 `showBasketAction`/`backHref` prop이 있음, 여기에 조회 기록 훅만 추가)

## 변경 사항

### 1. 공유 유틸/스토어/아이콘 (선행 작업)

- `src/lib/itinerary.ts` (신규): `SavedItinerariesList.tsx`에 있는 `formatDuration(duration)`을 추출해 export. `SavedItinerariesList.tsx`는 이 함수를 import해서 쓰도록 수정(로컬 정의 삭제). 새 `TripCard.tsx`도 이 함수를 재사용.
- `src/components/ui/icon.tsx`: `ICON_PATHS`에 `calendar`, `more`(케밥 점 3개), `heart` 3개 아이콘 추가. 기존 아이콘/사용처는 변경하지 않는다.
- `src/components/ui/dropdown-menu.tsx` (신규): `radix-ui`의 `DropdownMenu` 네임스페이스(`Root`/`Trigger`/`Portal`/`Content`/`Item`)를 감싼 얇은 shadcn 스타일 프리미티브. `Content`는 `bg-card border border-border rounded-lg shadow-md` 톤으로, `Item`은 hover 시 `bg-muted` 배경, `destructive` variant 지원(삭제 항목용 빨간 텍스트).
- `src/stores/favoriteStore.ts` + `src/hooks/useFavorites.ts` (신규): `basketStore.ts`/`useBasket.ts`와 동일한 구조로 미러링(`STORAGE_KEY = "pick-trip-favorites"`, `items: Content[]`, `hydrate/add/remove/isFavorited`).
- `src/stores/recentViewsStore.ts` + `src/hooks/useRecentViews.ts` (신규): 같은 패턴이되 `items: { content: Content; viewedAt: number }[]`, 최대 10개 유지(추가 시 동일 id 제거 후 맨 앞에 삽입, 10개 초과분은 자름), `addView(content)` 액션.
- `src/app/contents/[id]/_components/ContentDetailView.tsx`: `useRecentViews()`의 `addView`를 `useEffect(() => addView(content), [content.id])`로 호출해 상세 페이지 진입 시마다 기록(← `/contents`, `/explore` 두 경로 모두 이 컴포넌트를 거치므로 한 곳만 고치면 됨).

### 2. 헤더 — 로그인 시 nav를 "대시보드" 링크로 교체

`src/components/layout/Header.tsx`: `status === "authenticated"`이면 기존 `NAV_ITEMS.map(...)` nav 대신 `/dashboard`로 가는 링크 하나만 렌더(활성 판정은 `pathname.startsWith("/dashboard")`). 비로그인/로딩 상태는 기존 `NAV_ITEMS` nav 그대로. 로그아웃 버튼/유저 아바타 블록은 변경 없음.

### 3. 홈 리다이렉트

- `src/app/_components/HomeGate.tsx` (신규, client): `useAuth()`로 `status === "authenticated"`면 `useEffect`에서 `router.replace("/dashboard")` 호출하고 `null` 반환(리다이렉트 중 마케팅 화면이 잠깐 보였다 사라지는 깜빡임 방지). `status === "loading"`도 `null` 반환(짧은 로딩 동안 마케팅 화면 깜빡임 방지, `Header.tsx`가 로딩 중 플레이스홀더를 쓰는 것과 같은 패턴). 그 외(`unauthenticated`)에는 `children` 그대로 렌더.
- `src/app/page.tsx`: `<HeroSection/><RegionShowcase/><CtaSection/>`를 `<HomeGate>...</HomeGate>`로 감싼다. 서버 컴포넌트인 `page.tsx`가 클라이언트 컴포넌트 `HomeGate`를 children과 함께 감싸는 것은 Next.js에서 유효한 패턴(`HomeGate` 내부만 `"use client"`).

### 4. `/dashboard` 라우트

- `src/app/dashboard/page.tsx`: `/explore/page.tsx`와 동일한 패턴으로 `getContents({ regions: [...REGIONS], startDate: 오늘, nights: 0 })` 호출(에러 시 동일한 에러 메시지 문구), 결과를 `<DashboardClient recommendedPool={contents} />`에 넘긴다. `<main className="mx-auto w-full max-w-7xl px-4 py-10">` 셸.
- `src/app/dashboard/_components/DashboardClient.tsx` (client): `useAuth()`로 `status === "unauthenticated"`면 `router.replace("/")` 후 `null`(비로그인 직접 접근 가드, `HomeGate`와 대칭). `loading`도 `null`. `authenticated`면 `DashboardHero`, `MyTripsSection`, `ForYouSection`(`recommendedPool` 전달), `RecentSection`을 세로로 배치.
- `src/app/dashboard/_components/DashboardHero.tsx`: `grid grid-cols-1 lg:grid-cols-2 gap-6`.
  - 좌측: `안녕하세요, {user.nickname}님 👋` 제목 + 안내 문구 + `<ProgressStepper />`.
  - 우측: `Card`(`CardContent`) 배너 — 바구니 비었으면 "아직 담긴 콘텐츠가 없어요" + 설명, 담겨 있으면 "N개의 콘텐츠가 담겨 있어요" 같은 요약 문구. 하단에 `<Button asChild variant="destructive" className="w-full"><Link href="/explore">콘텐츠 둘러보기 &gt;</Link></Button>`.
- `src/app/dashboard/_components/ProgressStepper.tsx`: `useBasket()`/`useSavedItineraries()`를 직접 구독해 위 "사용자가 확정한 결정 사항"의 4가지 상태 중 하나를 계산, 3단계를 가로로 렌더(완료=체크 아이콘+진한 색, 진행중=강조 색, 예정=회색). 새 컴포넌트라 UI 프리미티브 없이 직접 마크업(연결선은 `border-t` 또는 배경색 바 형태로 간단히).

### 5. "내 여행" 섹션

- `src/app/dashboard/_components/MyTripsSection.tsx`: `useSavedItineraries()`의 `items`를 최대 6개(`slice(0,6)`) `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`로 렌더. 비어있으면 `SavedItinerariesList`의 빈 상태와 같은 톤(`아직 저장한 일정이 없습니다` + 북마크 아이콘). `items.length > 6`이면 우측 상단에 `<Link href="/itineraries">더보기 →</Link>`.
- `src/app/dashboard/_components/TripCard.tsx`: 좌측 캘린더 아이콘, 제목(`item.title`), 부제(`${REGION_LABELS[region]} · ${travelDate}`), 하단 chip 2개(지역 1개 + `formatDuration(duration)` 1개 — 실제 보유 데이터가 지역/기간뿐이라 "2~3개 지역명" 대신 지역+기간 조합으로 구성, PR에서 확인 필요하면 조정), 우측 상단 `DropdownMenu` 케밥(상세보기/공유하기/삭제), 우측 하단 `travelDate` + `→`. "상세보기"는 `SavedItinerariesList`와 동일한 인라인 펼침(로컬 state로 `getItinerary` 호출 후 카드 하단에 `ItineraryResult` 렌더, 로딩/에러 처리 동일 패턴), "공유하기"는 카드 하단에 `<ShareButton itineraryId={...} />` 토글 표시, "삭제"는 `remove(itineraryId)`.

### 6. "FOR YOU" 섹션

- `src/app/dashboard/_components/ForYouSection.tsx`: `recommendedPool: Content[]` prop 받음. `useBasket()`으로 이미 담긴 콘텐츠 제외(`isInBasket`), 상위 8개(`slice(0,8)`)를 `grid grid-cols-2 sm:grid-cols-4 gap-4`로 렌더.
- `src/app/dashboard/_components/RecommendedCard.tsx`: 상단 `aspect-video` 이미지 블록(이미지 없으면 `ExploreCard`와 동일한 회색 placeholder) 위에 카테고리 배지(`CATEGORY_BADGE_CLASSES`/`CATEGORY_LABELS`, absolute 포지션), 하단에 제목+주소(부제), 카드 푸터 좌측에 찜 아이콘 버튼(`useFavorites().isFavorited`로 토글, `heart` 아이콘 색만 상태에 따라 변경), 우측에 담기 버튼(`useBasket()`으로 토글 — 담기 전: `variant="destructive"`, "담기"; 담긴 후: `variant="outline"`, "담김").

### 7. "RECENT" 섹션

- `src/app/dashboard/_components/RecentSection.tsx`: `useRecentViews()`의 `items`가 비어 있으면 섹션 자체를 렌더하지 않는다. 있으면 `flex gap-4 overflow-x-auto` 가로 리스트, 각 항목은 작은 썸네일(고정 크기, 없으면 placeholder) + 제목 + 주소(부제), `Link href={`/contents/${content.id}`}`로 상세 이동(대시보드에서 바로 온 것이므로 `?from=explore` 마커는 붙이지 않음 — 기본 동작인 담기 버튼 있음/뒤로가기 버튼 유지).

## 테스트

패턴은 기존 테스트(예: `basketStore`/`useBasket`은 직접 테스트 파일이 없고 `ContentGrid.test.tsx`처럼 소비하는 컴포넌트 테스트로 커버되는 방식, `src/lib/content.test.ts` 스타일)를 따른다.

- `src/lib/itinerary.test.ts` (신규) — `formatDuration` 케이스(0=당일치기, N=N박 N+1일). coverage 설정이 `src/lib/**`에 80/70% 임계값을 걸어두므로 분기 커버 필수.
- `src/stores/favoriteStore.test.ts`, `src/stores/recentViewsStore.test.ts` (신규) — hydrate/add/remove(또는 addView)/cap 동작 단위 테스트.
- `Header.test.tsx` — `status: "authenticated"`일 때 기존 3개 nav가 사라지고 "대시보드" 링크(`href="/dashboard"`)만 보이는 케이스, `unauthenticated`/`loading`일 때 기존 nav 그대로인 케이스 추가.
- `HomeGate.test.tsx` (신규) — `authenticated`/`loading`이면 children 대신 아무것도 안 그리고 `router.replace`가 호출되는지(전자만), `unauthenticated`면 children 그대로 렌더되는지.
- `DashboardClient.test.tsx` (신규) — `unauthenticated`면 `router.replace("/")` 호출 + 빈 렌더, `authenticated`면 하위 섹션들이 렌더되는지(하위 섹션은 각자 테스트가 있으므로 여기서는 얕게 확인).
- `ProgressStepper.test.tsx` (신규) — 위 4가지 바구니/저장일정 조합별로 올바른 단계가 완료/진행중/예정으로 표시되는지.
- `TripCard.test.tsx` (신규) — 제목/부제/chip 렌더, 케밥 메뉴 열어서 상세보기 클릭 시 `getItinerary` 호출 및 인라인 렌더, 공유하기 클릭 시 `ShareButton` 노출, 삭제 클릭 시 `remove` 호출.
- `ForYouSection.test.tsx`/`RecommendedCard.test.tsx` (신규) — 바구니에 있는 항목 제외 필터링, 담기/찜 토글 동작.
- `RecentSection.test.tsx` (신규) — 빈 목록이면 섹션 미표시, 있으면 항목 렌더 및 링크 href.
- `ContentDetailView.test.tsx` — 마운트 시 `addView`가 호출되는지 케이스 추가.

## 작업 방식

기존 컨벤션(`.agents/rules/git-convention.md`, 지금까지의 세션 워크플로우)대로 진행한다: 이 계획을 `docs/superpowers/plans/`에 저장 → GitHub 이슈 생성(`CMU02/pick-trip-client`, `task` 라벨) → `feat/<이슈번호>` 브랜치 생성 → 위 순서대로(1→7) TDD로 구현·커밋 → `bun run test`/`lint`/`build` 통과 확인 → 브라우저로 로그인 상태 대시보드 화면 실제 확인.

## 검증

```bash
bun run test    # 신규/수정 테스트 전부 포함 전체 통과
bun run lint    # 기존 무관 CRLF 9건 외 신규 오류 없어야 함
bun run build   # /dashboard 라우트 타입체크 및 빌드 성공
```

브라우저로 로그인 계정으로 `/` 접속 시 `/dashboard`로 리다이렉트되는지, 헤더 nav가 "대시보드" 링크 하나로 바뀌는지, 바구니/저장 일정 상태를 바꿔가며 스텝퍼가 올바르게 반응하는지, FOR YOU 담기/찜, 내 여행 케밥 메뉴(상세보기/공유하기/삭제), RECENT 섹션(콘텐츠 상세 방문 후 채워지는지)을 직접 확인한다.
