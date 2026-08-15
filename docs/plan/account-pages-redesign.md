# 마이페이지/로그인/찜 화면 코랄 리디자인

## Context

전체 화면 리디자인([[home-redesign]], [[dashboard-redesign]], [[explore-contents-redesign]], [[itinerary-flow-redesign]]에 이어). **1차 작업은 디자인 핸드오프 문서(`design_handoff_picktrip_redesign/PickTrip 전체 화면.dc.html`, 2번 "로그인"·11번 "마이페이지"·7번 "찜한 목록" 섹션)를 확인하지 않고 임의로("이미 토큰 기반이라 변경 없음") 판단한 것으로 확인되어, 이번에 핸드오프 원본 기준으로 재작업한다.**

`/login`, `/mypage`, `/favorites`를 대상으로 한다.

## 구현

### login/page.tsx — 전면 재구성
- `1.1fr/1fr` 2분할. 좌측 코랄 그라데이션 패널(로고, "고른 콘텐츠가 / 일정이 됩니다" 카피, 하동·영주·예천 pill 3개) — 좁은 화면에서는 숨김(`hidden lg:flex`)
- 우측 380px 폭 카드: `WELCOME` 오버라인 → h1 로그인 → 소셜 버튼 2개(브랜드 색 유지) → 하단 "로그인 없이도 둘러보기/AI 일정 생성 가능" 안내 박스(신규)
- 카카오/구글 버튼 색상은 브랜드 색이라 변경하지 않음(1차 판단 그대로 유지)

### MyPageClient.tsx — 전면 재구성
- 프로필 카드: 상단 코랄 그라데이션 헤더(반투명 원 아바타 62px + 닉네임 + 가입일) + 하단 흰 영역(이메일/연동 계정 2열)
- 링크 카드 3열 신규: 내 여행(`/itineraries`)/찜한 콘텐츠(`/favorites`)/여행 바구니(`/explore`), 각각 실제 개수(`useSavedItineraries`/`useFavorites`/`useBasket`) 표시. 기존엔 "내 여행" 링크 1개뿐이었음
- "찜한 콘텐츠" 미리보기 섹션 신규: 4열 미니 카드(`FAVORITES_PREVIEW_COUNT = 4`), 빈 상태는 점선 카드 + `♡`

### FavoritesClient.tsx
- 제목 줄에 코랄 4px 바 + 개수 배지(`bg-accent`) 추가
- 빈 상태 버튼을 텍스트 링크 → 코랄 solid 버튼으로. 목적지를 `/dashboard/for-you`(핸드오프에 없는 화면)에서 `/explore`(핸드오프 실제 화면, `goExplore`와 동일한 의도)로 변경

### RecommendedCard.tsx / ContentCardActions.tsx (공유 컴포넌트)
- `RecommendedCard`: 카테고리 배지를 6색에서 코랄 단색으로, 상세 링크가 있는 카드에 호버 리프트 추가 — [[dashboard-redesign]]/[[explore-contents-redesign]]과 동일한 정정
- `ContentCardActions`: 담기 전 상태를 `bg-accent`(연한 코랄)로 — [[dashboard-redesign]]과 동일한 수정을 이 브랜치에도 반영(브랜치가 독립적이라 각자 반영 필요)

## 테스트

- `MyPageClient.test.tsx`: "카카오" 텍스트 중복(아바타 옆 + 연동 계정 행) 대응, 링크 카드 3개 href 검증, 찜한 콘텐츠 빈 상태/미리보기 테스트 추가
- `FavoritesClient.test.tsx`, `RecommendedCard`/`ContentCardActions` 관련 테스트는 기존 텍스트/role 기준이라 그대로 통과

## 검증

```bash
bun run test
bun run lint
bun run build
```
