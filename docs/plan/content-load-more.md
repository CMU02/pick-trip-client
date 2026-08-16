# 콘텐츠 탐색 페이지 "더보기" 페이지네이션 도입

## Context

홈 히어로의 "여행 콘텐츠" 지표를 실데이터(228개)로 바꾼 뒤, "왜 228개냐, 지역 콘텐츠는 60개로 아는데"라는 질문이 나와 조사했다.

- "60개"는 역사적 기획이 아니었다 — `pick-trip-server`/`pick-trip-client` git 히스토리·스펙 문서·코드 어디에도 그런 수량 계획이 없음.
- 진짜 원인은 지금도 실제로 발생 중인 버그: `contentService.ts`의 `getContents()`가 `/api/v1/contents` 호출 시 `page`/`size`를 안 넘겨서, 백엔드 기본값(지역당 `size=20`) 때문에 `/contents`, `/explore`가 항상 **지역 3곳 × 20개 = 60개까지만** 보여주고 있었다.
- 홈 히어로는 `total`(지역별 `totalCount` 합)을 쓰기 때문에 진짜 총합(하동 106 + 영주 70 + 예천 52 = 228, curl로 확인)이 정확히 나온다.
- "지역카드 228개를 만들자"는 개념 혼동이었다 — `RegionShowcase`의 지역 카드는 3장 고정, 콘텐츠 카드는 이미 배열 길이만큼 자동 렌더링됨. 필요한 건 새 카드가 아니라 페이지네이션.
- 백엔드는 범위 밖 페이지 요청에도 `200 + 빈 items`로 안전하게 응답함을 확인(`region=YECHEON&page=100&size=20`).

## 구현

### `contentService.ts`
- `GetContentsParams` export, `page?`/`size?` 선택 필드 추가(있을 때만 쿼리에 반영)

### `lib/content.ts`
- `mergeUniqueContents()` 추가 — `contentId` 기준 dedupe

### `hooks/useLoadMoreContents.ts` (신규)
- `useInfiniteQuery` 기반. `initialData`로 서버가 이미 받은 0페이지를 시드, `getNextPageParam`으로 소진 여부 판단
- 반환: `{ contents, total, hasMore, isLoadingMore, errorMessage, loadMore }`

### `contents/page.tsx`, `explore/page.tsx`
- `getContents` 결과의 `total`과 조회 파라미터를 그리드에 새 prop으로 전달

### `ContentGrid.tsx`, `ExploreGrid.tsx`
- `useLoadMoreContents` 연동, 필터링 대상을 훅의 누적 `contents`로 교체
- 리스트 맨 아래에 "더보기" 버튼(로딩/에러 상태 포함), 다 불러오면 자동으로 사라짐
- 필터는 여전히 "지금까지 로드된 데이터"에만 적용(기존 한계 유지, 이번 범위에서 서버사이드 필터링 미도입)

## 테스트

- `contentService.test.ts`: page/size 쿼리 반영
- `content.test.ts`: dedupe 케이스
- `useLoadMoreContents.test.ts` (신규): 초기 상태/이어붙임/dedupe/hasMore 전환/에러/조건 변경 리셋
- `ContentGrid.test.tsx`, `ExploreGrid.test.tsx`: `QueryClientProvider` wrapper 추가, 더보기 버튼 시나리오 추가

## 검증

```bash
bun run test
bun run lint
bun run build
```

브라우저로 `/explore`, `/contents`에서 더보기 클릭 → 228개(현재 기준)까지 전부 로드되는지 확인.
