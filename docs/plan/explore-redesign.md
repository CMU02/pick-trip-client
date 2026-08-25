# 콘텐츠 탐색 페이지 레이아웃 개편 지시서

대상: `/explore`(`ExploreGrid`), `/contents`(`ContentGrid`)
프로토타입: `docs/plan/explore-prototype.html` (브라우저로 열어 "제안 방식" 탭 확인)

---

## 1. 왜 바꾸나

지금 두 페이지는 `groupContentsByCategory(filtered)`로 화면을 **카테고리 6개 섹션**으로 나누고,
페이지 맨 아래에 **전역 "더보기" 버튼 하나**를 둔다. 여기서 세 가지 문제가 나온다.

1. **더보기 결과가 6개 섹션 중간중간에 삽입된다.**
   `getContents`는 지역마다 요청을 fan-out 하므로 한 번 클릭에 `20 × 지역수`개가 들어오고,
   그게 6개 섹션에 흩뿌려진다. 페이지 전체가 재배치되고 스크롤 위치가 무의미해진다.
   지역이 3개에서 더 늘어나면 그대로 악화된다.

2. **필터와 요청이 끊겨 있다.**
   `selectedRegions`는 이미 받아온 배열을 거르는 클라이언트 필터일 뿐이고,
   `queryParams.regions`는 항상 `REGIONS` 전체다. "하동"만 골라도 영주·예천을 계속 받아온다.

3. **`더보기 (24/347)`의 두 숫자가 기준이 다르다.**
   앞은 `loadedContents.length`(전체 로드 수), 뒤는 지역별 `totalCount`의 합.
   화면에 보이는 `filtered.length`와도 또 다르다.

## 2. 무엇으로 바꾸나

카테고리 섹션 그룹핑을 없애고 아래 구조로 간다.

```
[히어로]
[지역 탭: 전체 | 하동 | 영주 | 예천]     ← 단일 선택, 1차 축
[카테고리 칩: 한 줄 가로 스크롤]          ← 다중 선택, 2차 축
[검색창]
[활성 필터 pill · 초기화 · N개 결과 · "12 / 288 표시 중"]
[그룹핑 없는 균일 그리드]                 ← 지역/카테고리는 카드 배지로 표현
[더보기 버튼 하나 + 진행 바]              ← 항상 맨 아래에만 추가됨
```

핵심은 **새 카드가 항상 목록의 끝에만 붙는다**는 것. 지역이 몇 개로 늘어나도 이건 변하지 않는다.

---

## 3. 작업 순서

### 1단계 — 레이아웃 · 더보기 · 배지 (이번 작업 범위)

#### 1-1. 공용 컴포넌트 추출

`ExploreGrid`와 `ContentGrid`는 헤더/바구니 래퍼를 빼면 거의 동일하다.
`src/components/ContentBrowser.tsx`로 필터 + 결과 헤더 + 그리드 + 더보기를 묶고,
두 페이지는 이걸 감싸서 각자의 히어로/`BasketLayout`만 얹는다.

카드 컴포넌트는 `renderCard: (content: Content) => ReactNode` prop으로 주입한다.
`ExploreCard`(담기 없음)와 `ContentCard`(담기 있음)의 차이는 **이슈 #57에서 의도적으로 결정된 것**이므로
통합하지 말고 그대로 둔다. `ExploreCard.tsx` 상단 주석 참고.

#### 1-2. `ContentFilter` 개편

`src/components/ContentFilter.tsx`

- 지역: 다중 선택 wrap 칩 → **단일 선택 탭**. `전체` + `REGIONS`.
  `selectedRegions: Region[]` → `selectedRegion: Region | "ALL"`로 prop 시그니처 변경.
  넘칠 때 가로 스크롤(`overflow-x-auto`, 스크롤바 숨김). 각 탭에 개수 표시는 선택 사항.
  `role="tablist"` / `role="tab"` / `aria-selected` 사용.
- 카테고리: 지금처럼 다중 선택 칩이되 **wrap 금지, 한 줄 가로 스크롤**.
  좌우 화살표 버튼과 양끝 페이드는 프로토타입 참고(넘칠 때만 노출).
- 검색창은 그대로.

#### 1-3. 필터 ↔ 서버 요청 연결

`ExploreGrid` / `ContentGrid`에서 선택된 지역이 실제 요청 조건이 되게 한다.

```ts
const regions = selectedRegion === "ALL" ? [...REGIONS] : [selectedRegion];
const params = { ...queryParams, regions };
useLoadMoreContents({ queryKey: ["contents", params], queryParams: params, ... });
```

`queryKey`가 바뀌면 react-query가 조건별로 캐시를 분리해준다.

> **주의 — 여기서 기존 코드가 버그가 된다.**
> `useLoadMoreContents`는 `initialData`로 서버에서 받은 0페이지를 **무조건** 시드한다.
> `queryKey`가 바뀌면 새 키에도 같은 `initialData`(= 전체 지역 0페이지)가 시드되고,
> `staleTime: Number.POSITIVE_INFINITY` 때문에 재요청도 하지 않는다.
> → **하동 탭을 눌러도 전 지역 데이터가 그대로 보인다.**
>
> 해결: `initialData`를 **초기 조건과 동일할 때만** 넘긴다.
> ```ts
> initialData: isInitialParams ? { pages: [...], pageParams: [0] } : undefined
> ```
> 그리고 `initialData`가 없을 때의 로딩 상태(스켈레톤)를 훅과 UI에 추가한다.

> **주의 2 — `visiblePageCount`도 리셋해야 한다.**
> `useState(1)`이라 `queryKey`가 바뀌어도 유지된다. 조건 변경 시 1로 되돌릴 것.
> 훅 안에서 `queryKey`를 의존성으로 리셋하거나, 호출부에서 `key`로 리마운트시킨다.

> **주의 3 — 카테고리는 서버 필터가 아니다.**
> `GetContentsParams`에 category가 없고 `Content.category`도 optional이다(API가 안 내려줄 수 있음).
> 그래서 카테고리 칩은 **여전히 클라이언트 필터**로 남는다. 지역만 서버로 간다.
> 결과 헤더의 개수 표기가 이 비대칭을 감춰선 안 된다:
> - 카테고리 미선택: `N개 결과` + `12 / 288 표시 중` (N = 서버 total, 정확)
> - 카테고리 선택: `불러온 60개 중 12개` 식으로, 전체 total을 단정하지 않는 문구로 바꾼다.
>
> 근본 해결은 백엔드에 `category` 쿼리 파라미터를 추가하는 것 → 3단계.

#### 1-4. 그리드 렌더

`groupContentsByCategory` 호출을 제거하고 단일 `<div className="grid ...">`로 렌더.
컬럼 수는 지금 값을 유지한다 — `/explore`는 `sm:2 lg:4`, `/contents`는 `sm:2 lg:3`.

`src/lib/content.ts`의 `groupContentsByCategory`는 **삭제하지 말 것.**
홈 화면 큐레이션 rail에서 재사용할 수 있고, `src/lib/content.test.ts`에 테스트도 있다.

#### 1-5. 카드에 지역 배지

`ExploreCard.tsx`, `ContentCard.tsx` 썸네일 우상단에 `REGION_LABELS[content.region]` 배지 추가.
좌상단 카테고리 배지와 겹치지 않게. 반투명 흰 배경 + `backdrop-blur` 정도면 충분.
`ContentCard`는 담기 버튼과 겹치지 않는지 확인할 것.

#### 1-6. 더보기 리디자인

- 버튼 **하나만**. 라벨은 `{남은 개수 중 이번에 가져올 수} 개 더보기`.
- 버튼 아래 3px 진행 바 + `24 / 288` 텍스트.
- 로딩 중에는 버튼을 `불러오는 중`으로 바꾸고, **그리드 끝에 스켈레톤 카드 4장을 붙인다**
  (버튼 자리를 비우면 레이아웃이 튄다).
- 다 불러오면 버튼 대신 `288개를 모두 확인했어요`.
- **`간략히` 버튼은 제거**한다. 더보기가 끝에만 붙으므로 접을 이유가 없어졌다.
  `useLoadMoreContents`의 `collapse` / `canCollapse` / `visiblePageCount` 로직도 함께 정리한다.
  (단, 1단계에서 한 번에 지우기 부담되면 UI만 먼저 떼고 훅 정리는 뒤로 미뤄도 된다.)

#### 1-7. 결과 헤더

`{N}개 결과` 옆에 활성 필터 pill(지역 1개 + 카테고리 n개 + 검색어)과 `초기화` 링크.
pill의 × 를 누르면 해당 조건만 해제.

### 2단계 — URL 상태 반영 (별도 PR)

`/explore?region=hadong&category=food,nature&q=...`
`useState` → `useSearchParams` + `router.replace(..., { scroll: false })`.
뒤로가기·공유·새로고침 복원, 그리고 상세 페이지 다녀온 뒤 스크롤/로드 개수 복원까지 여기서 해결한다.
지금은 `/contents/[id]` 갔다 오면 필터가 전부 날아간다.

### 3단계 — 백엔드 협의 (별도 이슈)

`GET /api/v1/contents`에 `category` 파라미터 추가 요청.
그래야 카테고리도 서버 필터가 되고, `total`이 화면 개수와 정확히 일치한다.

---

## 4. 손대야 할 파일

| 파일 | 작업 |
| --- | --- |
| `src/components/ContentBrowser.tsx` | 신규 — 필터+헤더+그리드+더보기 공용화 |
| `src/components/ContentFilter.tsx` | 지역 단일선택 탭, 카테고리 한 줄 가로스크롤 |
| `src/app/explore/_components/ExploreGrid.tsx` | 그룹핑 제거, ContentBrowser 사용 |
| `src/app/contents/_components/ContentGrid.tsx` | 동일. `BasketLayout` 래퍼는 유지 |
| `src/app/explore/_components/ExploreCard.tsx` | 지역 배지. **담기 버튼은 추가하지 말 것(#57)** |
| `src/app/contents/_components/ContentCard.tsx` | 지역 배지 |
| `src/hooks/useLoadMoreContents.ts` | 조건부 `initialData`, `visiblePageCount` 리셋, collapse 정리 |
| `src/lib/content.ts` | `groupContentsByCategory` 유지(삭제 금지) |

## 5. 테스트

아래는 **깨질 것이 확실한** 기존 테스트다. 함께 갱신한다.

- `src/components/ContentFilter.test.tsx` — 지역 prop 시그니처가 바뀜
- `src/app/explore/_components/ExploreGrid.test.tsx`
- `src/app/contents/_components/ContentGrid.test.tsx` — 카테고리 섹션 헤딩 검증이 있으면 제거
- `src/hooks/useLoadMoreContents.test.tsx` — `initialData` 조건부 시드, collapse 제거
- `src/app/explore/_components/ExploreCard.test.tsx`, `src/app/contents/_components/ContentCard.test.tsx` — 지역 배지

새로 추가할 것:

- 지역 탭 전환 시 **다른 지역 데이터가 남아있지 않은지** (3-1의 `initialData` 버그 회귀 테스트)
- 지역 탭 전환 시 `getContents`가 **선택한 지역으로만** 호출되는지
- 더보기 후 새 항목이 **목록 끝에** 추가되는지
- 마지막 페이지에서 버튼이 완료 문구로 바뀌는지

## 6. 지켜야 할 것

- 패키지 매니저는 **Bun**. `bun run lint`(Biome), `bun run test`(vitest) 통과.
- Next.js 16 App Router — 훈련 데이터와 다르다. 라우팅·서버/클라이언트 경계를 건드리면
  `AGENTS.md`의 Required Reading 표에 있는 `node_modules/next/dist/docs/` 문서를 먼저 읽을 것.
- 코드 규칙은 `.agents/rules/code-convention.md`, 파일 구조는 `.agents/rules/file-structure.md`.
- 서버 컴포넌트(`explore/page.tsx`, `contents/page.tsx`)의 초기 fetch 구조는 유지한다.
  첫 화면은 계속 서버에서 렌더되어야 한다.
- 한 번에 다 하지 말고 1단계만. 2·3단계는 별도 PR/이슈로 남긴다.
