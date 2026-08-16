# 콘텐츠 탐색 화면 코랄 리디자인

## Context

전체 화면 리디자인([[home-redesign]], [[dashboard-redesign]]에 이어). **1차 작업은 디자인 핸드오프 문서(`design_handoff_picktrip_redesign/PickTrip 전체 화면.dc.html`, 4번 "콘텐츠 목록"·5번 "둘러보기" 섹션)를 확인하지 않고 임의로 설계한 것으로 확인되어 이번에 핸드오프 원본 기준으로 재작업한다.**

`/contents`, `/explore`, `/contents/[id]`를 대상으로 한다.

**`CATEGORY_BADGE_CLASSES`(카테고리별 6색) 관련 1차 판단을 정정한다.** 핸드오프 README에 "카테고리 배지는 전부 코랄 단색으로 통일, 구분은 섹션 그룹 헤더가 담당"이라고 명시돼 있는데, 1차 작업 때 이를 확인하지 않고 "기능적 배지라 유지"로 반대 결정을 내렸었다. 이번에 카드 위 배지를 전부 코랄 단색+흰 글자로 바꾼다(`CATEGORY_BADGE_CLASSES` 매핑 자체는 유지, 카드 컴포넌트에서 더 이상 참조하지 않음).

## 정책 충돌로 확인만 하고 넘어간 것

**`/explore`의 담기(바구니) 기능.** 핸드오프의 "둘러보기" 카드는 찜+담기 pill을 그대로 포함하지만, 이 저장소의 기존 결정(이슈 #57, `from=explore`면 상세 페이지 담기 버튼도 숨김)은 `/explore`를 의도적으로 "담기 없는 탐색 전용" 화면으로 만들었다. 사용자에게 확인한 결과 **기존 결정(담기 없음)을 유지**하기로 했다 — `ExploreCard`는 여전히 "상세 설명" 링크만 가진 원래 구조를 유지하고, 코랄 배지/호버 등 시각 스타일만 반영했다.

## 구현

### ContentCard.tsx / ExploreCard.tsx (contents 목록)
- 카테고리 배지를 이미지 위 코랄 단색 오버레이로 이동
- `ContentCard`는 담기/찜 액션을 `ContentCardActions`(ForYouCard와 동일 컴포넌트)로 자체 관리하도록 변경 — 상위(`ContentGrid`)에서 `isInBasket`/`onToggleBasket`을 prop으로 내려주던 구조 제거
- `ExploreCard`는 위 정책 충돌에 따라 원래 구조(상세 설명 버튼만) 유지, 이미지 높이(150px)·코랄 배지·호버만 반영

### ContentGrid.tsx / contents/page.tsx
- 페이지 헤더 추가: `Step 2 · 콘텐츠 담기` 오버라인, h1, 조건 요약 한 줄(`{지역} · {날짜} · {기간}`), 결과 개수
- `contents/page.tsx`에 `formatConditionLine` 헬퍼 추가(지역 라벨/날짜/기간 조합)
- 카드 그리드 3열로 변경(우측 바구니 패널과 함께 배치되는 `1fr/320px` 레이아웃 기준)
- 카테고리 그룹 헤더에 코랄 4px 바 추가

### ExploreGrid.tsx / explore/page.tsx
- 상단 코랄 그라데이션 히어로 추가(`EXPLORE` 오버라인, h1, 서브카피) — 검색창은 기존 `ContentFilter`의 검색 입력을 그대로 사용(핸드오프는 히어로 안에 별도 검색창을 두지만, 필터 영역과 검색이 중복되지 않도록 하나로 유지)
- 카테고리 그룹 헤더에 코랄 4px 바 추가

### ContentFilter.tsx
- 검색 입력에 🔍 아이콘 프리픽스 추가, placeholder를 "장소 이름이나 주소로 검색"으로 변경

### ContentDetailView.tsx
- 카테고리 배지를 이미지 위 코랄 단색 오버레이로 이동
- 찜(하트) 버튼 신규 추가(44px 정사각, `useFavorites` 연동) — 기존엔 담기 버튼만 있었음
- 정보 목록을 세로 1열 → 2열 그리드로 변경

### BasketPanel.tsx
- 우선순위 선택 배지를 `PRIORITY_SELECTED_CLASSES`(3색) 대신 코랄 단색으로 통일 — 핸드오프가 우선순위 3단계를 전부 같은 코랄로 표시하고(선택 여부만 구분), 배지 문구(`필수`/`가능하면`/`선택`)로 구분하는 것을 확인해 반영. 이 판단은 [[itinerary-flow-redesign]]의 `TripSummary`/`PlaceItem`에서도 동일하게 재검토 필요
- radius/그림자를 핸드오프 값(20px, `0 14px 34px oklch(.5 .02 30/.06)`)에 맞춤
- "AI 일정 생성" 버튼 아래 힌트를 canGenerate 여부와 무관하게 항상 표시(준비 완료 시 "AI가 이동 거리를 고려해 배치합니다")

## 테스트

- `ContentCard.test.tsx`/`ExploreCard.test.tsx`(ContentCard만): `ForYouCard.test.tsx` 패턴에 맞춰 전면 재작성(store 기반 자체 상태 검증)
- `ContentDetailView.test.tsx`: 찜 버튼 테스트 2개 추가
- 나머지는 기존 텍스트/role 기준 테스트가 구조 변경에 영향받지 않아 그대로 유지

## 검증

```bash
bun run test
bun run lint
bun run build
```
