# 대시보드 화면 코랄 리디자인

## Context

홈 화면 리디자인([[home-redesign]])에 이어 전체 화면 리디자인의 다음 단계. 별도 디자인 핸드오프 문서는 없어 홈에서 확립한 코랄 비주얼 언어(코랄 accent, `rounded-xl`/`rounded-2xl` + `border-border bg-card`, 호버 시 `-translate-y` 리프트, 코랄 그라데이션)를 대시보드(`/dashboard`, `/dashboard/for-you`)에 확장 적용한다.

대시보드 대부분의 컴포넌트(`ProgressStepper`, `ForYouSection`, `RecentSection`, `MyTripsSection`)는 이미 `text-primary`/`bg-primary`/`border-border` 같은 전역 토큰을 쓰고 있어 코랄 테마 토큰 교체만으로 이미 반영돼 있다. 이번 작업은 하드코딩된 색상(`amber`, `destructive` 버튼 오용)과 카드 호버 효과가 빠진 부분만 정리한다.

`CATEGORY_BADGE_CLASSES`(`src/types/content.ts`)는 콘텐츠 탐색 화면과 공유하는 파일이라 이 브랜치에서 건드리지 않는다 — 콘텐츠 탐색 리디자인 단계에서 처리.

## 구현

### DashboardHero.tsx
- 우측 `Card`: `border-primary/20 bg-gradient-to-br from-primary/5 to-white` 톤 추가(홈 히어로의 연한 코랄 그라데이션과 통일)
- CTA 버튼: `variant="destructive"` → 기본(`variant` 생략, 코랄 primary) pill 버튼으로 수정 — 원래 강조 CTA인데 destructive variant가 잘못 쓰이고 있었음

### TripCard.tsx
- 아이콘 칩: `bg-amber-50 text-amber-500` → `bg-primary/10 text-primary`
- 카드에 `transition-colors hover:border-primary/30 hover:shadow-md` 추가(내부에 드롭다운/펼침 패널이 있어 `-translate-y`는 넣지 않음)

### ForYouCard.tsx (dashboard/for-you)
- 카드 호버를 홈 지역 카드와 동일한 톤으로: `hover:-translate-y-0.5 hover:shadow-md` → `hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg`

### 변경 없음
- `ProgressStepper.tsx`, `ForYouSection.tsx`, `RecentSection.tsx`, `MyTripsSection.tsx`, `DashboardClient.tsx`, `ForYouGrid.tsx`, `ForYouClient.tsx`, `dashboard/page.tsx`, `dashboard/for-you/page.tsx` — 이미 전역 토큰만 사용해 코랄 테마가 자동 반영됨

## 테스트

기존 테스트는 텍스트/role 기준으로 검증하고 있어 클래스명 변경으로는 깨지지 않는다. 별도 테스트 추가 없이 기존 스위트로 회귀만 확인한다.

## 검증

```bash
bun run test
bun run lint
bun run build
```

추가로 `bun run dev`에서 로그인 상태로 `/dashboard`, `/dashboard/for-you` 접속해 히어로 카드/CTA 버튼/내 여행 카드/추천 카드 호버가 코랄 톤으로 보이는지 육안 확인.
