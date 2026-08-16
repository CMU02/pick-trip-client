# 공통 헤더 코랄 리디자인

## Context

전체 화면 리디자인([[home-redesign]], [[dashboard-redesign]], [[explore-contents-redesign]], [[itinerary-flow-redesign]], [[account-pages-redesign]]에 이어). 4개 화면 그룹 브랜치 어디서도 공통 헤더(`src/components/layout/Header.tsx`)는 손대지 않아 GitHub 이슈 #4에 후속 작업으로 남아있었음.

디자인 핸드오프 원본(`design_handoff_picktrip_redesign/PickTrip 전체 화면.dc.html` + `README.md`) 0번 섹션 "공통 헤더" 기준으로 작업한다.

## 확인 후 결정한 사항

핸드오프는 헤더 스펙 텍스트만 있고(프로토타입 HTML에는 헤더가 실제 렌더링돼 있지 않음), 아래 두 가지는 사용자와 협의해 범위를 좁혔다.

- **내비게이션 구성**: 핸드오프는 "홈/콘텐츠 둘러보기/대시보드/내 일정" 고정 4개를 제시하지만, `대시보드`·`내 일정`은 인증 보호 라우트라 비로그인 사용자에게 고정 노출하면 리다이렉트가 발생함. **기존 인증 상태별 분기 로직(`NAV_ITEMS`/`DASHBOARD_NAV_ITEMS`)은 그대로 유지**하고 pill 스타일만 적용.
- **바구니 pill 클릭 목적지**: `BasketLayout`(패널+드로어)이 `/contents`/`/dashboard/for-you`/`/favorites` 3곳에 로컬 state로 각각 붙어있어, 전역 드로어로 승격하려면 3개 컴포넌트를 건드리는 리팩터링이 필요함. **범위를 넘어서므로 `/contents`로 이동하는 링크**로 결정(바구니 패널이 있는 대표 화면).
- 마이페이지/로그아웃 버튼, 비로그인 버튼, 로딩 스켈레톤은 핸드오프에 명시된 변경 사항이 없어 **기능·구조 변경 없이 유지**.

## 구현

### Header.tsx

- 컨테이너: `sticky top-0 z-40 h-[66px] border-b border-border bg-white/[.93] backdrop-blur-[14px]` (기존 불투명 `bg-card` → 반투명 블러)
- 로고: 24px 코랄 그라데이션(`oklch(0.63 0.2 30)`→`oklch(0.53 0.2 16)`) 라운드 사각형(8px) + `Pick`(기본색)+`Trip`(코랄), `text-[20px] font-extrabold tracking-[-0.035em]`
- 내비: 기존 인증 분기 로직 유지, pill(`rounded-full px-[13px] py-2`)로 래핑. 활성 = `bg-accent text-accent-foreground font-bold`(기존 `--accent`/`--accent-foreground` 토큰이 핸드오프의 primary-soft/primary-deep 값과 동일해 재사용)
- 바구니 pill 신규: `useBasket()`의 `items.length`를 로그인 여부와 무관하게 항상 표시(바구니는 localStorage 기반), `/contents`로 이동하는 링크, `bg-accent text-accent-foreground` pill + `bookmark` 아이콘
- 아바타: 기존 teal 원형(`bg-teal-100`) → 코랄 그라데이션 원(28px, `h-7 w-7`) + 흰 이니셜. 닉네임과 함께 `rounded-full border border-border` pill로 감싸고 `hover:border-[oklch(0.82_0.06_30)]` 추가

## 테스트

- `Header.test.tsx` 신규(또는 보강): 인증 상태별 내비 항목 렌더링, 바구니 pill 개수 표시 및 `/contents` 링크, 아바타 이니셜 렌더링 검증

## 검증

```bash
bun run test
bun run lint
bun run build
```
