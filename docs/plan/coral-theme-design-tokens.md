# 전역 디자인 토큰을 코랄 테마로 교체

## Context

전체 화면 리디자인(코랄 단일 액센트 + 순백 배경, `design_handoff_picktrip_redesign` 문서 기준)의 1단계. 화면별 작업(홈부터 순차 진행 예정)에 앞서 `globals.css`의 전역 색상/라운드 토큰만 먼저 교체한다.

폰트는 바꾸지 않는다 — 디자인 문서는 제목=Paperlogy/본문=Pretendard 분리를 전제하지만, 최근 병합(chore/61)에서 이미 Paperlogy를 전체 본문 폰트로 통일했고 이번 작업에서도 그 결정을 유지하기로 확인함.

## 구현

`src/app/globals.css`의 `:root` 블록에서 디자인 문서의 "globals.css 변경 지점" 스니펫대로 아래 값만 교체한다(그 외 변수는 그대로):

| 변수 | 기존 | 변경 |
| --- | --- | --- |
| `--background` | `var(--color-gray-50)` | `#ffffff` |
| `--primary` | `var(--color-amber-500)` | `oklch(0.6 0.19 28)` |
| `--accent` | `var(--color-amber-50)` | `oklch(0.955 0.04 30)` |
| `--accent-foreground` | `var(--color-amber-700)` | `oklch(0.52 0.19 28)` |
| `--ring` | `var(--color-amber-500)` | `oklch(0.6 0.19 28)` |
| `--border` | `var(--color-gray-200)` | `oklch(0.93 0.012 30)` |
| `--input` | `var(--color-gray-200)` | `oklch(0.93 0.012 30)` |
| `--radius` | `0.625rem` | `0.875rem` |

`--primary-foreground`는 이미 흰색이라 변경 없음. `--foreground`/`--muted`/`--muted-foreground`/`--card`/`--secondary`/`--destructive`/`--chart-*`/`--sidebar-*`/`.dark` 블록은 디자인 문서의 변경 스니펫에 없으므로 건드리지 않는다.

`@theme inline`이 `--radius`로부터 `radius-sm~4xl`을 전부 파생시키고, `--primary`/`--ring`/`--accent`/`--border`/`--input`을 shadcn 컴포넌트가 그대로 참조하므로, 컴포넌트 코드를 하나도 건드리지 않아도 버튼/카드/입력/포커스 링/라운드가 앱 전체에 즉시 반영된다.

## 범위 제외

- `ink`/`muted-2`/`surface-2`/`surface-3`/`primary-deep`/`border-accent`/일·토요일 색상 등 화면별 커스텀 토큰 — 해당 값을 실제로 쓰는 화면(홈, 조건선택 캘린더 등) 작업에서 추가
- `CATEGORY_BADGE_CLASSES`를 코랄 단색으로 통일하는 것 — 콘텐츠 카드 화면 작업 범위
- Pretendard 본문 폰트 도입 — 하지 않기로 확정
- `.dark` 블록 — 앱에 다크모드 토글이 없어 미사용, 손대지 않음

## 검증

```bash
bun run lint
bun run build
```

추가로 `bun run dev`로 홈/헤더/버튼 등 주요 화면에서 코랄 액센트와 더 둥근 라운드가 적용됐는지 육안 확인.
