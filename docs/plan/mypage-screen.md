# 마이페이지 화면 구현 계획

## Context

로그인 영역(헤더) 옆에 "마이페이지" 진입점이 없다. 로그인 전/후 모두 같은 자리에 버튼을 두되, 로그인 전에는 로그인 화면으로 보내고 로그인 후에는 실제 마이페이지 화면을 보여주는 게 목표다. 이번 작업은 화면(뷰)만 구현한다 — 프로필 수정, 로그아웃 등 기존 기능과 중복되는 액션은 넣지 않는다.

## 확정 사항

1. 헤더의 로그인/로그아웃 버튼 옆에 "마이페이지" 버튼을 추가한다.
   - 비로그인: `마이페이지` 버튼 → `/login?next=/mypage` (로그인 후 마이페이지로 이동)
   - 로그인: `마이페이지` 버튼 → `/mypage`
2. `/mypage`는 다른 보호 라우트(`/dashboard`, `/favorites`)와 동일하게 비로그인 직접 접근 시 `/`로 리다이렉트한다.
3. 화면 내용(신규 API 없이 기존 `useAuth().user` 데이터만 사용):
   - 프로필 카드: 아바타(닉네임 첫 글자, Header와 동일한 스타일), 닉네임, 이메일(없으면 미표시), 로그인 제공자(카카오/구글 라벨), 가입일(한국어 포맷)
   - 바로가기 카드: "내 여행" → `/itineraries` (기존 라우트 재사용, 신규 로직 없음)

> 참고: 이 브랜치는 `main` 기준으로 분리했다. `/favorites`(찜한 콘텐츠)는 아직 main에 병합되지 않은 feat/58 작업이라 이번 화면에는 포함하지 않는다. feat/58이 병합된 뒤 바로가기를 추가하는 후속 작업으로 남긴다.

## 재사용할 기존 코드/패턴

- `DashboardClient.tsx`/`ForYouClient.tsx`/`FavoritesClient.tsx`의 비로그인 가드 패턴(`useEffect` + `status === "unauthenticated"` → `router.replace("/")`)
- `Header.tsx`의 아바타 스타일(`bg-teal-100 text-teal-700` 원형 이니셜)
- `src/types/auth.ts`의 `UserMeResponse`(`uid, email, nickname, profileImageUrl, provider, createdAt`)
- 로그인 리다이렉트 패턴: 기존 `로그인` 버튼이 이미 `/login?next=${encodeURIComponent(pathname)}` 형태를 쓰고 있음 — 마이페이지 버튼은 `next`를 현재 경로가 아니라 고정값 `/mypage`로 넘긴다.

## 신규/변경 파일

**신규**
- `src/app/mypage/page.tsx` — 얇은 서버 셸(`<MyPageClient />` 렌더)
- `src/app/mypage/_components/MyPageClient.tsx` — 비로그인 가드 + 프로필 카드 + 바로가기 카드
- `src/app/mypage/_components/MyPageClient.test.tsx`

**변경**
- `src/components/layout/Header.tsx` — 로그인/로그아웃 버튼 옆에 "마이페이지" 버튼 추가 (비로그인/로그인 두 상태 모두)
- `src/components/layout/Header.test.tsx` — 두 상태에서 마이페이지 링크 href 검증 케이스 추가

## 검증

- `bun run lint`, `bun run test`, `bun run build`
- 브라우저: 로그아웃 상태에서 마이페이지 버튼 → `/login?next=/mypage` → 로그인 완료 후 `/mypage`로 도착하는지, 로그인 상태에서 바로 `/mypage` 진입 및 카드 내용 확인
