# 마이페이지/로그인/찜 화면 코랄 리디자인

## Context

전체 화면 리디자인 5단계([[home-redesign]], [[dashboard-redesign]], [[explore-contents-redesign]], [[itinerary-flow-redesign]]에 이어). `/mypage`, `/login`, `/favorites`를 대상으로 한다. 별도 디자인 핸드오프 문서는 없어 앞선 화면들에서 확립한 코랄 언어를 확장 적용한다.

`login/page.tsx`, `FavoritesClient.tsx`는 이미 전역 토큰(`Card`, `text-primary`)만 사용해 코랄 테마가 자동 반영돼 있다. 카카오/구글 로그인 버튼의 `bg-[#FEE500]`/`bg-white`는 각 소셜 플랫폼의 공식 브랜드 색이라 유지한다(변경 대상 아님).

작업 중 `ContentCardActions.tsx`(`favorites`가 사용하는 `RecommendedCard`의 액션 버튼, [[dashboard-redesign]]의 `ForYouCard`도 공유)에서 "담기"(아직 담기지 않은 상태) 버튼에 `variant="destructive"`가 잘못 쓰인 것을 발견했다. [[dashboard-redesign]]의 `DashboardHero` CTA와 동일한 종류의 버그라 이번에 같이 고친다 — 공유 컴포넌트지만 `/favorites`에서 바로 보이는 문제라 이 브랜치 범위로 포함한다.

## 구현

### MyPageClient.tsx
- 아바타 칩: `bg-teal-100 text-teal-700` → `bg-primary/10 text-primary`
- "내 여행" 바로가기 카드: `hover:bg-muted/50` → `transition-colors hover:border-primary/30 hover:bg-muted/50`([[dashboard-redesign]] `TripCard` 호버와 통일)

### ContentCardActions.tsx (버그 수정)
- 담기 버튼: `variant={inBasket ? "outline" : "destructive"}` → `variant={inBasket ? "default" : "outline"}` — `ContentCard.tsx`의 기존 담기 버튼 컨벤션(담긴 상태=코랄 채움, 아닌 상태=아웃라인)과 동일하게 맞춘다

### 변경 없음
- `login/page.tsx` — 이미 `Card`/`text-primary` 토큰만 사용, 소셜 버튼은 브랜드 색 유지
- `FavoritesClient.tsx`, `RecommendedCard.tsx` — 이미 전역 토큰만 사용. `RecommendedCard`는 `detailHref` 없이 쓰이는 곳(대시보드 `ForYouSection`)이 있어 카드 자체에 호버를 넣지 않는다(비클릭 상태에 클릭 가능한 것처럼 보이지 않도록)

## 테스트

기존 `MyPageClient.test.tsx`는 텍스트/role 기준 검증이라 클래스명 변경으로 깨지지 않는다. `ContentCardActions`는 별도 테스트 파일이 없어(호출부 테스트로 커버) 회귀만 확인한다.

## 검증

```bash
bun run test
bun run lint
bun run build
```

추가로 `bun run dev`에서 로그인 상태로 `/mypage`, `/favorites`, `/login` 접속해 아바타 칩·담기 버튼·소셜 로그인 버튼이 의도대로 보이는지 육안 확인.
