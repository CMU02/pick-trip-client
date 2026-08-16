# 홈 화면(랜딩) 리디자인

## Context

전체 화면 리디자인의 2단계(1단계: 코랄 전역 토큰, `main`에 병합 완료). `design_handoff_picktrip_redesign` 문서의 "1. 홈 (랜딩)" 스펙을 홈 화면(`src/app/page.tsx` + `_components/*`)에 반영한다. `HomeGate`(로그인 시 `/dashboard` 리다이렉트)는 건드리지 않는다 — 대시보드 리디자인은 별도 단계.

버튼 모양은 필(pill) 유지로 확정(공용 `Button` 컴포넌트 미변경). region 대표 이미지 필드가 없어 지역 카드 이미지는 문서의 줄무늬 placeholder를 그대로 쓴다.

## 구현

### HeroSection.tsx — 전면 재작성
- `grid-cols-[1.05fr_0.95fr]` 2단, 배경 연한 코랄→흰색 그라데이션(`bg-gradient-to-b from-[oklch(0.985_0.02_30)] to-white`) + 우상단 장식 원 2개(`absolute`, `rounded-full`, 반투명 코랄)
- 좌측: 코랄 필 배지 `PICK TRIP` → h1(카피 동일, "나만의 일정"만 `text-primary`) → 본문(카피 동일) → 버튼 2개(기존 그대로, `Button`/`Button variant="outline"`) → 지표 3개(정적 텍스트: `3곳`/`경상도 소도시`, `14개`/`여행 콘텐츠`, `30초`/`AI 일정 생성`)
- 우측: `grid-cols-2 grid-rows-[150px_150px_150px]` 모자이크. 3개는 줄무늬 placeholder(`repeating-linear-gradient` 인라인 style), 1개는 코랄 배경 카드(`AI 일정` / `1박 2일 코스 완성`)

### RegionShowcase.tsx — 카드 구조 변경
- `Card`/`CardHeader`/`CardTitle` 대신 `ContentCard.tsx`와 같은 패턴(`overflow-hidden rounded-xl border border-border bg-card`, `Link`로 전체 감싸기)
- 상단 150px 줄무늬 placeholder 블록 → 지역 컬러 바(`REGION_COLORS`) + 영문 코드(지역 enum 값 그대로, 예: `HADONG`) → 지역명(`REGION_LABELS`) → 설명(`REGION_DESCRIPTIONS`) → `일정 만들기 →`
- 호버: `hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg`(기존 대비 이동 효과 추가)
- 카드 클릭 href는 기존과 동일(`/select/conditions?regions=${region}`) — 변경 없음

### StepsSection.tsx — 신규
- "세 단계로 끝나요" 제목(중앙 정렬) + 3열 그리드
- 각 카드: `bg-muted/40 rounded-xl border border-border p-6`, 코랄 번호 사각형(36px, `bg-primary text-primary-foreground rounded-xl`) + 제목 + 설명
- 정적 데이터(문서 그대로):
  1. `지역과 날짜 선택` / `가고 싶은 지역과 출발일, 기간을 고릅니다.`
  2. `콘텐츠 담기` / `마음에 드는 장소를 바구니에 담고 우선순위를 정합니다.`
  3. `AI 일정 생성` / `이동 거리와 운영 시간을 고려한 일정이 만들어집니다.`

### CtaSection.tsx — 배경/버튼 스타일 변경
- 바깥 `section`은 배경 제거, 안쪽에 `rounded-3xl bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] text-white p-12`
- 카피/href는 기존 그대로. 버튼은 기존 `Button` 재사용하되 `className`으로 색만 커스텀: 첫 번째는 흰 배경(`bg-white text-primary hover:bg-white/90`), 두 번째는 투명 배경 + 반투명 흰 테두리(`variant="outline"` + `border-white/50 bg-transparent text-white hover:bg-white/10`)

### page.tsx
- `RegionShowcase` 다음, `CtaSection` 앞에 `<StepsSection />` 추가

## 테스트

- `HeroSection.test.tsx`: 기존 헤드라인/CTA href 검증 유지 + 지표 3개(`3곳`, `14개`, `30초`) 노출 검증 추가
- `RegionShowcase.test.tsx`: 기존 지역명/설명/href 검증 유지 + `일정 만들기 →` 텍스트 노출 검증 추가
- `CtaSection.test.tsx`: 기존 CTA href 검증 그대로(카피/href 안 바뀜, 스타일만 변경이라 추가 검증 불필요)
- `StepsSection.test.tsx`: 신규 — 3단계 제목 3개(`지역과 날짜 선택`/`콘텐츠 담기`/`AI 일정 생성`)와 번호 1/2/3 노출 검증

## 검증

```bash
bun run test
bun run lint
bun run build
```

추가로 `bun run dev`에서 비로그인 상태로 `/` 접속해 히어로 모자이크·지역 카드·3단계 섹션·CTA 밴드가 문서와 맞는지 육안 확인.
