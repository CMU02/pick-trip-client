# 일정 공유 페이지 코랄 리디자인

## Context

전체 화면 리디자인([[home-redesign]], [[dashboard-redesign]], [[explore-contents-redesign]], [[itinerary-flow-redesign]], [[account-pages-redesign]], [[header-redesign]]에 이어). `/share/[id]`는 4개 화면 그룹 브랜치 어디에도 포함되지 않아 GitHub 이슈 #4에 완전 미착수 상태로 남아있었음.

디자인 핸드오프 원본(`design_handoff_picktrip_redesign/PickTrip 전체 화면.dc.html` + `README.md`) 10번 섹션 "일정 공유" 기준으로 작업한다.

## 확인 후 결정한 사항

- `DayCard`/`PlaceItem`은 이미 `editor` prop 유무로 읽기 전용 모드를 지원하고 있어 컴포넌트 자체는 변경하지 않음. 두 컴포넌트의 코랄 스타일 자체는 `feat/itinerary-flow-redesign` 브랜치가 이미 반영 중이라, 이 브랜치에서 함께 손대면 두 브랜치가 같은 파일을 두고 충돌함 — 각자 병합 시 자연히 맞춰지도록 범위에서 제외.
- 헤더는 `src/app/layout.tsx`에서 전역으로 렌더링되므로, 레이아웃 구조를 바꾸는 대신 `Header.tsx`에 경로 기반 분기(`/share/`로 시작하면 `null` 반환)를 추가해 "헤더 없음(공개 페이지)" 요구를 만족시킴.

## 구현

### `Header.tsx`
- `pathname.startsWith("/share/")`이면 `null` 반환

### `CopyLinkBox.tsx` (신규, `src/app/share/[id]/_components/`)
- 클라이언트 컴포넌트. `window.location.href`로 현재 URL을 표시(모노스페이스)하고 흰 `링크 복사` 버튼 클릭 시 `navigator.clipboard.writeText` 후 1.5초간 `복사됨` 표시(기존 `ShareButton.tsx`의 클립보드 패턴 재사용)

### `page.tsx`
- 상단 히어로(`bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] text-white`, 전체 폭): `PickTrip` 워드마크 + `공유된 일정 · 읽기 전용` pill + 제목 34px + 메타(`지역 · 날짜 · 기간 · N곳`) + `CopyLinkBox`
- 본문(`max-width 900px`, 배경 `oklch(0.985 0.008 30)`): 기존 `<ItineraryResult data={data} />` 그대로
- 하단 CTA 카드: `나도 이런 일정 만들어볼까요?` + `PickTrip 시작하기` 코랄 버튼(`Link href="/"`)
- 오류/만료 상태: 히어로 없이 중앙 정렬 카드, 기존 문구 `유효하지 않거나 만료된 공유 링크입니다.` 유지

### `loading.tsx`
- 새 레이아웃(히어로 + 본문)에 맞춘 스켈레톤으로 갱신

## 테스트

- `CopyLinkBox.test.tsx` 신규: 클립보드 복사 호출, "복사됨" 표시 후 원복
- `page.tsx`는 async 서버 컴포넌트라 기존 관례상 별도 테스트 없이 수동 검증으로 대체(README 체크리스트: 만료 링크, 모바일 폭)

## 검증

```bash
bun run test
bun run lint
bun run build
```
