# 대시보드 화면 코랄 리디자인

## Context

전체 화면 리디자인([[home-redesign]]에 이어). **1차 작업(색상/호버 위주)은 디자인 핸드오프 문서(`design_handoff_picktrip_redesign/PickTrip 전체 화면.dc.html`, 6번 "대시보드" 섹션)를 확인하지 않고 임의로 설계한 것으로 확인되어 이번에 핸드오프 원본 기준으로 재작업한다.** 핸드오프 HTML의 실제 마크업(라인 422-545)과 상태 로직(`dashStats`, `progressSteps`, `quick`, `basketCardTitle/Desc`)을 그대로 재현한다.

## 구현

### DashboardHero.tsx — 전면 재작성
- `grid-cols-[1.4fr_1fr]` 2단. 좌측 코랄 그라데이션 히어로(24px 라운드, 우하단 반투명 원 장식) — "여행 준비 N단계" pill, 인사말, 서브카피, 카드형 진행 스테퍼
- 우측: `DashStats`(통계 3카드) + 코랄 테두리 바구니 안내 카드(그라데이션 배경, CTA 버튼)
- CTA 버튼 href를 `/select/conditions?regions=ALL`에서 `/explore`로 수정 — 홈 히어로의 동일 라벨 버튼과 목적지가 달랐던 기존 불일치를 핸드오프의 `goExplore` 동작에 맞춰 바로잡음(버그 수정)

### ProgressStepper.tsx — 카드형으로 재작성
- 기존 가로 스텝 인디케이터 → 3열 카드(도달한 단계=흰 카드+코랄 번호+코랄 바, 예정 단계=반투명). `computeStepStatuses`/`currentStepNumber`를 export해 `DashboardHero`의 "N단계" 배지와 공유
- 단계 판정 로직(바구니/저장된 일정 개수 기반)은 기존 그대로 유지 — 핸드오프는 "출발일 선택 여부"를 2단계 기준으로 쓰지만, 앱에 그 상태를 전역으로 추적하는 곳이 없어 대체 불가(별도 상태 신설 없이는 구현 불가 — 데이터 한계로 보고)

### DashStats.tsx — 신규
- 담은 콘텐츠 / 찜한 장소 / 저장한 일정 3개 통계 카드, 클릭 시 이동. 핸드오프의 `go('contents')`는 프로토타입 전용 화면이라 바구니를 채울 수 있는 실제 라우트 `/explore`로 매핑

### QuickCategoryRow.tsx — 신규
- 문화/음식/자연/체험/전체 5열 퀵 카테고리. 선택 시 아래 FOR YOU 추천 섹션이 필터링됨(`DashboardClient`에서 `category` 상태로 연결)

### DashboardClient.tsx
- `QuickCategoryRow` 추가, `MyTripsSection`+`RecentSection`을 `1fr/330px` 2열로 배치(기존은 세로 순차 배치)

### MyTripsSection.tsx / RecentSection.tsx
- `MyTripsSection`: "MY TRIP" 오버라인 대신 코랄 4px 바 + 오버라인 형태로 헤더 변경, 빈 상태에 "지역 선택하기" 버튼 추가(핸드오프에 있었으나 기존엔 없었음)
- `RecentSection`: 가로 스크롤 → 카드 패널(테두리+배경) 안 세로 리스트로 변경. 핸드오프에 있던 "RECENT" 오버라인은 실제 대시보드 섹션 마크업엔 없어 제거(테스트도 갱신)
- 핸드오프의 "하동, 지금 가기 좋아요" 지역 추천 배너는 실제 데이터 소스(지역별 추천 신호)가 없어 구현하지 않음 — 별도 보고 대상

### ForYouSection.tsx
- 코랄 4px 바 헤더로 변경, `category` prop 추가(퀵 카테고리 필터 연동)

### RecommendedCard.tsx / ForYouCard.tsx(dashboard/for-you) — 배지 색상 수정
- 카테고리 배지를 `CATEGORY_BADGE_CLASSES`(카테고리별 6색) 대신 코랄 단색+흰 글자로 통일. 핸드오프 README에 "카테고리 배지는 전부 코랄 단색으로 통일, 구분은 섹션 그룹 헤더가 담당"이라고 명시돼 있는데, 1차 작업 때 이를 확인하지 않고 반대로(6색 유지) 판단했던 것을 바로잡음

### ContentCardActions.tsx — 담기 버튼 색상 수정
- 담기 전 상태를 `outline`(회색 톤)이 아니라 핸드오프의 `CORAL_SOFT`/`CORAL_DEEP`에 대응하는 `bg-accent text-accent-foreground`(연한 코랄)로 수정. 담긴 상태는 기존대로 코랄 solid

## 데이터 한계로 보고(구현하지 않음)

- 스테퍼의 "출발일 선택" 기준 2단계 판정 — 전역 상태 없음
- "하동, 지금 가기 좋아요" 같은 지역별 동적 추천 배너 — 백엔드 신호 없음
- `/dashboard/for-you`(FOR YOU 더보기 전용 페이지) — 핸드오프 11개 화면 목록에 아예 없음(프로토타입에서 "더보기"는 `/explore`로 연결됨). 페이지 존재 자체를 임의로 없애지 않고 유지하되, 레이아웃 변경은 하지 않음

## 테스트

- `ProgressStepper.test.tsx`: 기존 상태 판정 테스트는 접근성 라벨(`aria-label`) 기준이라 카드 스타일 변경에 영향받지 않음
- `DashboardHero.test.tsx`: CTA href(`/explore`)와 배지 카피(`콘텐츠 N개를 담았어요`) 기대값 갱신, "여행 준비 N단계" 배지 노출 테스트 추가, `next/navigation`/`favoriteStore` 목 추가
- `RecentSection.test.tsx`: 제거된 "RECENT" 텍스트 검증 삭제
- `DashStats.test.tsx`, `QuickCategoryRow.test.tsx`: 신규
- `ForYouSection.test.tsx`: `category` 필터 테스트 추가

## 검증

```bash
bun run test
bun run lint
bun run build
```
