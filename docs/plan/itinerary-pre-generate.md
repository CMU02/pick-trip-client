# Task: 일정 생성 전 화면(여행 요약) 리디자인 — `/itinerary`

대상: `src/app/itinerary/page.tsx` + `src/app/itinerary/_components/*`
범위: **AI 일정 생성 전 상태만.** 생성 후 결과 화면(일차 카드, 편집 버튼)은 이 작업 대상이 아닙니다.

현재 화면은 좁은 `여행 요약` 카드 하나와 `일정 생성하기` 버튼만 있어 페이지 대부분이 비어 있습니다.
이를 히어로 + 2열 레이아웃으로 다시 짭니다. 색(코랄)·폰트(제목 Paperlogy / 본문 Pretendard)·헤더·푸터는
현재 그대로 유지합니다. 토큰 값은 `design_handoff_picktrip_redesign/README.md` 참고.

---

## 페이지 골격

```
헤더(기존 그대로)
main (max-width 1180px, padding 34px 36px 80px)
├── 브레드크럼: 지역 선택 › 콘텐츠 담기 › 일정 생성
├── 히어로 (코랄 그라데이션, radius 26px)
├── 2열 그리드 (1fr / 340px, gap 22px, align-items:start)
│   ├── 좌: 여행 조건 → 담은 콘텐츠 → AI가 고려하는 것   (flex column, gap 20px)
│   └── 우: 여행 요약 → 생성 CTA → 생성 후 안내          (sticky top 86px, gap 14px)
푸터(기존 그대로)
```

**장식용 반투명 원(blob)은 넣지 않습니다.** 그라데이션 면만 씁니다.

## 아이콘

전부 기존 `@/components/ui/icon` 의 `<Icon name=... />` 을 씁니다. 이모지 금지.
- 지역 → `attraction` (map-pin)
- 출발일 / 날짜 → `calendar`
- 기간 → **초승달**. `ICON_PATHS`에 없으므로 `moon` 키를 추가해주세요:
  `"M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A6.5 6.5 0 0 1 13.36 3.1C12.92 3.04 12.46 3 12 3z"`
- 동행 → `user`
- 담은 콘텐츠 → `bookmark`
- 삭제 → `close`
- 생성 버튼 → `wand`
- AI 고려 카드 → `attraction` / `calendar` / `food`

## 1. 히어로

- radius `26px`, padding `34px 38px 32px`, 흰 글자
- 배경 `linear-gradient(122deg, oklch(0.64 0.2 32) 0%, oklch(0.56 0.2 20) 54%, oklch(0.49 0.17 12) 100%)`
- 좌측
  - pill `STEP 3 · 일정 생성` — 배경 `rgba(255,255,255,.2)`, `11px / 800 / letter-spacing .12em`
  - h1 **Paperlogy 800, 36px, line-height 1.22, -0.045em**: `담은 콘텐츠로` / `일정을 만들어볼까요?` (2줄)
  - 설명 `14.5px / line-height 1.65 / rgba(255,255,255,.85)`, max-width 430px:
    `아래 조건과 콘텐츠를 확인한 뒤 생성하세요. 이동 거리와 운영 시간을 고려해 순서를 배치합니다.`
- 우측 지표 3칸 (min-width 330px)
  - `grid-template-columns: repeat(3,1fr)`, `gap: 1px`, radius 16px, overflow hidden
  - 컨테이너 배경 `rgba(255,255,255,.16)` → 칸 배경 `rgba(255,255,255,.1)` (1px gap이 구분선처럼 보임)
  - 각 칸: 라벨 `11px/700 rgba(255,255,255,.75)` + 값 **Paperlogy 800 23px** + 단위 `11.5px/600`
  - 값: `담은 콘텐츠 N개` / `여행 기간 N일`(= nights + 1) / `하루 평균 N곳`(= round(담은 수 / 일수), 최소 1)

## 2. 여행 조건 카드 (좌)

- radius 22px, `1px solid oklch(0.93 0.012 30)`, 흰 배경
- 헤더: 4px 코랄 세로바 + `여행 조건`(Paperlogy 700, 18px, -0.03em), 우측에 `조건 수정 →`
  (`12.5px / 700 / 코랄`) → `/select/conditions` 로 이동 (기존 쿼리 유지)
- 본문 2×2 그리드, gap 10px. 각 칸:
  - padding `15px 17px`, radius 15px, `1px solid oklch(0.94 0.012 30)`
  - 좌측 36px 정사각 타일: radius 12px, 배경 `oklch(0.965 0.03 30)`, 아이콘 색 `oklch(0.55 0.16 28)`, 18px
  - 라벨 `11.5px / 600 / oklch(0.6 0.015 30)` + 값 `14.5px / 700 / -0.02em`
  - 4칸: 지역 / 출발일 / 기간 / 동행 조건

## 3. 담은 콘텐츠 카드 (좌)

- 헤더: 코랄 바 + `담은 콘텐츠` + 개수 배지(`oklch(0.955 0.04 30)` 배경 / `oklch(0.52 0.19 28)` 글자 / `11.5px 800`),
  우측 `콘텐츠 더 담기 →` → `/contents`
- **우선순위별로 묶어서** 표시 (`useBasket` 의 priority). 그룹 순서: MUST → SHOULD → OPTIONAL, 빈 그룹은 숨김
  - 그룹 헤더: 배지 + 설명 문구
    - `꼭 가기` — 코랄 solid / 흰 글자 · `일정에 반드시 포함합니다`
    - `가면 좋음` — `oklch(0.955 0.04 30)` / `oklch(0.52 0.19 28)` · `여유가 있으면 넣습니다`
    - `선택` — `oklch(0.965 0.008 30)` / `oklch(0.5 0.015 30)` · `동선이 맞을 때만 넣습니다`
  - 그룹 본문: 2열 그리드, gap 9px. 아이템 행 =
    42px 썸네일(radius 12px, `content.imageUrl`; 없으면 스트라이프 플레이스홀더)
    + 이름 `13.5px/700` 1줄 말줄임
    + 메타 줄 `카테고리 · 지역` (`11px`, 사이에 3px 점)
    + 우측 26px 삭제 버튼(`close`, 호버 시 destructive 톤)
  - 삭제는 `useBasket`의 remove
- 바구니가 비면 점선 빈 상태(`1.5px dashed oklch(0.88 0.055 30)`) + `담은 콘텐츠가 없습니다` + `콘텐츠 둘러보기` 코랄 버튼

## 4. AI가 고려하는 것 (좌)

- radius 22px, 배경 `oklch(0.985 0.012 30)`, `1px solid oklch(0.94 0.012 30)`, padding `22px 24px 24px`
- 제목: 코랄 바 + `AI가 고려하는 것` (Paperlogy 700, 16px)
- 3열 그리드, gap 10px. 각 카드: 흰 배경, radius 14px, padding `16px 18px`
  - 30px 아이콘 타일(radius 10px, `oklch(0.965 0.03 30)`) + 제목 `13.5px/700` + 설명 `12px / line-height 1.5`
  - `이동 거리` — 가까운 곳끼리 묶어 하루 동선을 짧게 만듭니다
  - `운영 시간` — 문 여는 시간에 맞춰 방문 순서를 정합니다
  - `식사 시간` — 점심·저녁에 음식 콘텐츠를 배치합니다
- 설명은 2줄 안에 들어가야 합니다. 문구를 늘리지 마세요(3줄이 되며 마지막 줄에 한 글자만 남습니다).

## 5. 여행 요약 카드 (우, sticky)

- radius 22px, `1px solid oklch(0.93 0.012 30)`, 흰 배경
- 제목: 코랄 바 + `여행 요약` (Paperlogy 700, 17px)
- 5행. 각 행 `padding: 12px 0`, 하단 `1px solid oklch(0.97 0.006 30)` (마지막 행은 없음)
  - 좌: 25px 아이콘 타일(radius 9px, `oklch(0.97 0.015 30)`, 아이콘 14px `oklch(0.55 0.1 30)`) + 라벨 `12.5px / oklch(0.55 0.015 30)`
  - 우: 값 `13px / 700`, 우측 정렬
  - 행: 지역 / 날짜 / 기간 / 동행 / 담은 콘텐츠
- 하단에 `예상 일정 규모` 행: `oklch(0.975 0.012 30)` 배경 박스, 값 `N일 · 약 N곳`

## 6. 생성 CTA 카드 (우)

- radius 22px, padding 22px, 흰 글자, 배경 `linear-gradient(140deg, oklch(0.63 0.2 30), oklch(0.51 0.19 14))`
- 제목(Paperlogy 700, 17px) + 설명(`12.5px / rgba(255,255,255,.85)`)은 준비 상태에 따라 분기
  - 준비 완료: `생성 준비 완료` / `조건과 콘텐츠가 모두 준비됐습니다. 생성까지 약 30초 걸립니다.`
  - 미완료: `조건을 조금만 더` / `지역·출발일을 정하고 콘텐츠를 2개 이상 담아주세요.`
- 버튼: 전체폭, padding 15px, radius 13px, `wand` 아이콘 + `일정 생성하기`, `15px / 700`
  - 활성: 흰 배경 / `oklch(0.52 0.19 28)` 글자, 호버 `translateY(-2px)`
  - 비활성: `rgba(255,255,255,.2)` 배경 / `rgba(255,255,255,.7)` 글자 / `cursor: not-allowed`
- 버튼 아래 힌트 `11.5px / rgba(255,255,255,.75)`: 활성 `생성 후에도 순서를 바꿀 수 있어요` / 비활성 `조건이 모두 채워지면 활성화됩니다`
- **활성 조건**: 지역 있음 && 출발일 있음 && 담은 콘텐츠 ≥ 2

## 7. 생성 후 안내 카드 (우)

- radius 22px, `1px solid oklch(0.93 0.012 30)`, 배경 `oklch(0.99 0.006 30)`, padding `18px 20px`
- 제목 `13px / 700`: `생성 후에도 바꿀 수 있어요`
- 불릿 3개 (`12px / line-height 1.5 / oklch(0.52 0.015 30)`, 코랄 `·` 프리픽스)
  - 장소 순서를 위·아래로 옮길 수 있습니다
  - 마음에 안 드는 장소는 지우거나 다른 곳으로 바꿉니다
  - 꼭 넣고 싶은 장소는 고정해두면 다시 생성해도 남습니다

## 8. 날짜 포맷 버그 — 반드시 고쳐주세요

현재 화면은 쿼리 파라미터가 비어 있을 때 `NaN월 NaN일` 을 그대로 출력합니다.

```ts
function formatStartDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}
```

- `null` 이면 값 자리에 `미선택` 을 `oklch(0.68 0.015 30)` 색으로 표시합니다 (여행 조건 카드 + 여행 요약 행 둘 다)
- 지역이 비었을 때도 같은 처리
- 이 상태에서는 생성 버튼이 비활성이어야 합니다

## 상태 / 데이터

새 상태 없음. 기존 것만 씁니다.
- `useBasket` — 담은 콘텐츠 목록, 우선순위, 삭제
- 쿼리 파라미터 `regions` / `startDate` / `nights` — 지역·출발일·기간
- 동행 조건은 `COMPANION_CONDITIONS` 라벨로 변환해 쉼표로 이어 붙입니다
- 지표(하루 평균 등)는 위 데이터에서 파생 계산. 별도 API 없음

## 하지 말 것

- 히어로/CTA에 반투명 원 장식 넣지 않기
- 이모지 사용하지 않기 (`Icon` 컴포넌트만)
- 생성 후 결과 화면 건드리지 않기
- `여행 조건` 카드와 `여행 요약` 카드가 같은 값을 보여주는 건 의도된 것입니다(좌: 넓게 확인 + 수정 진입, 우: sticky 요약). 임의로 한쪽을 지우지 마세요.
