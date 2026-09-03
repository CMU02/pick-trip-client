# 카테고리 노출 순서를 명시적 상수로 통일

이슈: CMU02/pick-trip-client#104
브랜치: `refactor/104`
Task 문서: `task-home-hero-category-order.md` / 시안 `홈 화면 v2 (보관).dc.html`

## 배경

시안은 실제 컴포넌트를 기준으로 되돌린 것이라 히어로 · 지역 섹션 · 푸터(Task 1 · 2 · 4)는
대부분 "이미 맞는지 확인"에 해당한다. 실제 코드 변경은 **카테고리 순서(Task 3)** 하나다.

목표 순서:

```
음식(FOOD) → 축제(FESTIVAL) → 관광지(ATTRACTION) → 문화(CULTURE) → 자연(NATURE) → 체험(EXPERIENCE)
```

## 현재 상태 조사

| 항목 | 상태 | 조치 |
|---|---|---|
| `HeroSection.tsx` | CTA 2개 · 스탯 3개 · 스트라이프 그리드 · 코랄 카드 모두 시안과 일치. 개수는 `CONTENT_COUNT = 221` 한 곳만 사용, 하드코딩된 배지 개수 없음 | 코드 변경 없음 |
| `RegionShowcase.tsx` | 헤더 문구 · 3열 카드 · `REGION_DESCRIPTIONS` · `CONDITIONS_HREF`(전체 지역) 모두 일치 | 코드 변경 없음 |
| `Footer.tsx` | 4열(브랜드/서비스/지역/문의·지원+이메일) + 하단 저작권·약관. `콘텐츠 정보 오류 신고`는 폼 URL 미정이라 주석 유지 | 코드 변경 없음 |
| 카테고리 순서 | `src/types/content.ts` 의 `CONTENT_CATEGORIES = Object.keys(CATEGORY_LABELS)`. `CATEGORY_LABELS` 키 순서가 우연히 목표와 동일해 **현재 화면 순서는 이미 맞음**. 단, 라벨맵 키 순서에 암묵적으로 의존하는 구조 | 명시적 상수로 교체 |

### 카테고리 순서 소비처 (모두 `CONTENT_CATEGORIES` 참조 — 하드코딩된 다른 순서 배열 없음)

- `src/components/ContentFilter.tsx` — `/explore` · `/contents` 필터 칩 (`CategoryChipRow`)
- `src/lib/content.ts` — `groupContentsByCategory`(그룹 헤더 순서), `sortContentsByCategory`(다중 선택 정렬)
- `src/components/ContentBrowser.tsx` — URL 쿼리 파싱 시 유효 카테고리 검사(`.includes`)

### 범위 밖

- `src/app/dashboard/_components/QuickCategoryRow.tsx` — 대시보드 퀵 카테고리. 핸드오프 스펙상
  의도적으로 5칸(축제 제외) + `전체` 순이며 Task 문서 "확인할 곳"에도 없음 → 건드리지 않음
- `CATEGORY_LABELS` · `CATEGORY_ICONS` · `CATEGORY_BADGE_CLASSES` 등 `Record<ContentCategory, …>`
  매핑은 키 순서와 무관 → 그대로

## 구현

### `src/types/content.ts`

```ts
// 카테고리를 노출하는 모든 곳(필터 칩 · 그룹 헤더 · 다중 선택 정렬)이 따르는
// 단일 순서. 라벨맵 키 순서에 의존하지 않도록 명시적으로 고정한다.
export const CONTENT_CATEGORY_ORDER = [
  "FOOD",
  "FESTIVAL",
  "ATTRACTION",
  "CULTURE",
  "NATURE",
  "EXPERIENCE",
] as const satisfies readonly ContentCategory[];

// 기존 소비처가 쓰던 mutable 배열. 순서는 위 상수 하나가 결정한다.
export const CONTENT_CATEGORIES: ContentCategory[] = [...CONTENT_CATEGORY_ORDER];
```

- `Object.keys(CATEGORY_LABELS)` 파생 제거.
- `CONTENT_CATEGORIES` 이름은 유지해 6개 파일 소비처를 건드리지 않는다(순서의 출처만 명시화).
- 필터 칩에 `전체`가 별도 항목으로 있으면 맨 앞에 둔다 — 단, 현재 `ContentFilter` 카테고리 칩은
  다중 토글이라 `전체` 항목이 없다(지역 탭에만 `전체`가 있고 이미 맨 앞). 추가 조치 불필요.

### 테스트

- `src/components/ContentFilter.test.tsx` — 카테고리 칩이 `CONTENT_CATEGORY_ORDER` 순서대로
  렌더되는지 검증 추가.
- `src/lib/content.test.ts` — 기존 "선언 순서" 테스트 문구를 `CONTENT_CATEGORY_ORDER` 기준으로 갱신
  (동작 동일, 명시적 참조).
- `src/types/content.test.ts` — `CONTENT_CATEGORIES` 가 `CONTENT_CATEGORY_ORDER` 와 같은지 가벼운 검증.
- `HeroSection.test.tsx` — 기존 유지(변경 없음).

## 검증

```bash
bun run test
bun run build
bun run lint
```

## 완료 후

PR 생성 → 이슈 #104 연결(`Closes #104`). 병합 방식 Merge Commit.
