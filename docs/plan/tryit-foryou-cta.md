# 홈 TryIt 카드 스타일 통일 + 일정 만들기 CTA

- 이슈: CMU02/pick-trip-client#113
- 브랜치: `feat/113`
- 선행: `docs/plan/home-redesign-v2.md` (#110, main 병합됨)

## 목표

홈 `TryItGallery`를 실제 콘텐츠 카드와 같은 모양으로 바꾸고, 담은 결과가 AI 일정
생성 흐름으로 이어지게 한다. 담기 동작 자체(바구니 토글)는 그대로 둔다.

## 구현

### 1. `src/app/_components/TryItCard.tsx` — 신규

`ForYouCard`(`dashboard/for-you/_components`)와 동일한 마크업. 라우트 전용 컴포넌트라
직접 import 대신 홈 `_components`에 같은 패턴으로 둔다. 공유 컴포넌트(`ContentImage`,
`ContentCardActions`)를 그대로 쓴다.

- `<div rounded-[18px] border bg-card hover:-translate-y-1 …>`
- 상단 `h-[140px]` `ContentImage` + 코랄 카테고리 배지(좌상단) + 지역 배지(우상단)
- 본문: 제목 `14.5px/700` · 주소 `xs muted` · 요약 `line-clamp-2`
- `Link href={/contents/${id}}` (from 파라미터 없음 → 상세에서 담기 버튼 노출됨:
  `page.tsx`의 `showBasketAction={from !== "explore"}`)
- 하단 `mt-auto p-4 pt-2` → `<ContentCardActions content={content} />`

### 2. `src/app/_components/TryItGallery.tsx` — 수정

- 커스텀 `TryItCard`(파스텔 타일) 삭제, `TILE_BG`/`TILE_FG`/`NEUTRAL_*` 상수 삭제.
- 그리드에 새 `<TryItCard content={c} />` 렌더.
- 담기 상태를 카드가 자체 관리(`ContentCardActions` → `useBasket`)하므로
  `TryItGallery`는 `add`/`remove`를 카드에 넘길 필요 없음. `items`는 보조문구·CTA
  개수 표시용으로만 구독.
- 카드 그리드 아래 **섹션 CTA**:
  - `items.length >= 1` → `<Button asChild size="lg">담은 {items.length}곳으로 일정 만들기</Button>`
  - `items.length === 0` → `<Button asChild size="lg" variant="outline">여행 조건부터 정하기</Button>`
  - 목적지: `/select/conditions?regions=${ALL_REGIONS_QUERY}` (히어로 "AI 일정 살펴보기"와 동일)
  - `React Compiler` 메모 이슈 회피 위해 `items` 배열 직접 구독(기존 주석 유지).
- `useQuery(["contents", "home-try-it", …])` 캐싱은 그대로 유지.

### 3. 바구니 지속 — 검증만 (코드 변경 예상 없음)

흐름: 홈 TryIt 담기 → `useBasketStore` → localStorage `pick-trip-basket` →
`/select/conditions`(조건 입력, 바구니 안 건드림) → `/contents`(콘텐츠 담기,
`useBasket()`로 같은 스토어 읽음) 에서 그대로 보인다.

- 바구니를 비우는 지점은 `handleGenerate` 성공 후 / 로그인 전 생성 폴백뿐
  (`ItineraryClient`). 조건→콘텐츠 담기 경로엔 없음.
- 회귀 테스트: `useBasketStore`에 항목을 넣고 `/contents` 그리드(`ContentGrid` 또는
  basket 페이지)가 그 항목을 담긴 상태로 렌더하는지 — 기존 테스트로 이미 커버되면
  스킵, 아니면 `TryItGallery.test.tsx`에 "담기 후 store에 유지" 케이스로 충분.

## 테스트

- `TryItGallery.test.tsx` 갱신:
  - 카드 4개 렌더(제목 기준) / 칩 필터 / 칩 순서 (기존 유지)
  - 담기 클릭 → `useBasketStore.getState().items` 1개, 버튼 라벨 `담김` (← `✓ 담았어요`에서 변경)
  - `items` 0개 → CTA `여행 조건부터 정하기`, href `/select/conditions?regions=…`
  - `items` 2개(setState) → CTA `담은 2곳으로 일정 만들기`
  - 보조문구는 기존 로직 유지
- `TryItCard.test.tsx` 신규: 이미지·배지·제목·주소·`ContentCardActions`(담기 버튼) 렌더,
  링크 `/contents/{id}` (from 없음)

## 검증

```bash
bun run test
bun run lint
bun run build
```

`bun run dev` 비로그인 `/` → TryIt 카드 모양, 담기 → CTA 개수 반영 →
`/select/conditions` 이동 → 조건 입력 → `/contents`에서 바구니 유지 육안 확인.

## 하지 말 것

- 담기 버튼이 바로 페이지 이동하게 만들지 않는다(담기 = 바구니 토글, 이동은 CTA만).
- `ForYouCard`를 홈에서 직접 import 하지 않는다(라우트 전용).
- 파스텔 타일 카드 스타일로 되돌리지 않는다.
