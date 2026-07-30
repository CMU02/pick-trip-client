# 지역 선택 페이지 제거 및 콘텐츠 탐색 페이지 지역/카테고리 필터 통합

이슈: #53 (선행 작업: #52 홈페이지+헤더 네비게이션)

## 배경

`/select`(Step1 지역 선택)는 체크박스로 지역을 고른 뒤 `/select/conditions`(Step2 날짜/기간/동행조건)로 넘어가는 별도 페이지였다. 앞으로 지역 선택 페이지는 사용하지 않고, 대신 `/contents`(콘텐츠 탐색 페이지) 안에 지역 버튼을 카테고리 버튼과 같은 방식으로 넣어 지역도 하나의 필터로 다루기로 했다.

단, `/select/conditions`(Step2)는 그대로 유지한다. `src/services/contentService.ts`를 보면 백엔드 `/api/v1/contents`는 지역을 한 번에 하나만 받고(region당 개별 호출 후 클라이언트에서 병합), `startDate`/`nights`를 필수 쿼리로 요구한다. 이 단계를 없애면 콘텐츠 조회 자체가 깨지므로, 날짜/기간 입력은 계속 Step2에서 받는다.

## 변경 범위

### 1. `/select`(Step1) 제거

삭제 대상:
- `src/app/select/page.tsx`
- `src/app/select/_components/RegionSelectGrid.tsx`, `RegionSelectGrid.test.tsx`
- `src/app/select/_components/RegionCard.tsx`

`RegionSelectGrid.tsx`는 마운트 시 `useBasket().clear()`를 호출해 "새 여행 계획 시작 시 이전 바구니를 비운다"는 책임을 지고 있었다. 이 페이지가 사라지므로, 이제 실질적인 여행 계획 시작점이 되는 `TravelDateForm.tsx`(Step2)의 마운트 시점으로 이 책임을 옮긴다. 옮기지 않으면 이전 계획에서 담아둔 바구니가 새 탐색에도 그대로 남는 회귀가 생긴다.

### 2. `/contents` 페이지에 지역 필터 추가

`src/app/contents/_components/ContentFilter.tsx`에 카테고리 버튼 행 위에 지역 버튼 행을 추가한다. `src/types/region.ts`의 `REGIONS`/`REGION_LABELS`를 재사용하고, 기존 카테고리 버튼과 동일한 토글 버튼 스타일(선택 시 `border-primary bg-accent text-accent-foreground`, 아닐 때 `border-border bg-card hover:border-primary/40`)을 그대로 적용한다.

`src/app/contents/_components/ContentGrid.tsx`에는 `selectedRegions` 상태와 `matchRegion` 필터를 카테고리 필터(`selectedCategories`/`matchCategory`)와 완전히 동일한 패턴으로 추가한다 — 빈 선택은 "전체 표시"를 의미하며, `Content.region` 필드가 이미 존재하므로 서버/서비스 코드 변경은 필요 없다. 지역 필터와 카테고리 필터는 독립적으로 함께 적용된다(AND 조건).

### 3. 콘텐츠 탐색 진입 링크 변경

`/select`가 사라지므로, `/select`를 가리키던 3곳의 링크를 `/select/conditions?regions=HADONG,YEONGJU,YECHEON`(3개 지역 전체를 기본값으로 전달)로 바꾼다:
- `src/components/layout/Header.tsx`의 "콘텐츠 탐색" nav 링크
- `src/app/_components/HeroSection.tsx`의 "콘텐츠 둘러보기" CTA
- `src/app/_components/CtaSection.tsx`의 "콘텐츠부터 골라보기" CTA

`/select/conditions`와 `TravelDateForm`은 코드 변경 없이 그대로 동작한다 — `regions` 쿼리 파라미터를 그대로 받아 다음 단계로 전달하는 얇은 통로 역할이었으므로, 링크를 바꾸는 것만으로 충분하다.

`src/app/_components/RegionShowcase.tsx`(홈페이지 지역 소개 카드)는 이미 `/select/conditions?regions=HADONG` 형태로 단일 지역을 프리셋하고 있어 변경하지 않는다.

## 테스트 변경

- `RegionSelectGrid.test.tsx` 삭제(파일 삭제에 따라 자동 제거)
- `Header.test.tsx`, `HeroSection.test.tsx`, `CtaSection.test.tsx`의 "콘텐츠 탐색"/"콘텐츠 둘러보기"/"콘텐츠부터 골라보기" href 기대값을 `/select/conditions?regions=HADONG,YEONGJU,YECHEON`로 수정
- `ContentFilter.test.tsx`에 지역 버튼 렌더링/토글 테스트 추가
- `ContentGrid.test.tsx`에 지역 필터 적용 시 결과가 좁혀지는 케이스, 지역+카테고리 동시 적용 케이스 추가
- `TravelDateForm.test.tsx`에 마운트 시 바구니 clear가 호출되는지 검증 케이스 추가

## 범위 밖

- 백엔드 API 계약(`contentService.ts`)은 변경하지 않는다 — region당 개별 호출 구조를 그대로 유지한다.
- `/select/conditions`의 UI/로직은 변경하지 않는다.
- 이번 작업은 #52 위에 쌓은 `feat/53` 브랜치에서 진행하며, #52가 먼저 병합되어야 한다.
