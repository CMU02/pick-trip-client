# 장바구니 진입 페이지(/basket) 신설 및 바구니 → 여행조건 흐름 연결

## Context

헤더의 장바구니 아이콘이 `/contents`(쿼리 파라미터 없음)로 이동했다. `/contents`는
여행 조건(지역·날짜)이 있어야 콘텐츠를 불러오는 "Step 2" 페이지라, 조건 없이
진입하면 `getContents`가 빈 지역 배열로 fan-out → 결과 0건 → 본문이
"콘텐츠가 없습니다". 여행 바구니 패널만 담긴 콘텐츠를 보여주는 반쪽 상태였다.

또한 여행 바구니에서 "AI 일정 생성"을 눌렀을 때:
- `/contents`: `generateHref`가 `/itinerary` 직행 (조건 이미 있으니 정상)
- `/favorites`, `/dashboard/for-you`: `/select/conditions` 경유

즉 진입 페이지가 없고, 흐름도 페이지마다 제각각이었다.

GitHub 이슈: #92 · 관련(미머지): [[basket-persist-through-conditions]] (feat/88)

## 결정

1. **`/basket` 페이지 신설** — 사용자가 담은 콘텐츠만 카드로 보여준다.
   - 본문: `RecommendedCard` 그리드(상세 링크 `/contents/{id}`)
   - 담긴 지역이 2곳 이상이면 지역 탭(`전체` + 담긴 지역들)으로 클라이언트 필터
   - 우측/하단: 기존 `BasketLayout`의 여행 바구니 패널·드로어 재사용
   - 빈 상태: 안내 문구 + `/explore` 링크
   - 전부 클라이언트(localStorage) 상태라 `page.tsx`는 껍데기, 로직은
     `_components/BasketPageClient.tsx`
2. **헤더 장바구니 아이콘 → `/basket`**, **마이페이지 "여행 바구니" 카드 → `/basket`**
   (기존 `/explore`)
3. **`/basket`의 "AI 일정 생성" → `/select/conditions`** (여행 조건 경유).
   지역은 담긴 콘텐츠에서 추려 넘기고(`regionsInBasket.join(",")`), 비었으면
   `ALL_REGIONS_QUERY`. `/contents`는 현행 유지(`/itinerary` 직행).
4. **`TravelDateForm` 마운트 시 `clear()` 제거** — 바구니가 여행 조건 페이지를
   거쳐 `/contents`까지 유지되도록. 완료된 일정의 바구니 정리는
   `ItineraryClient.handleGenerate`가 이미 담당하므로 회귀 영향 없음.
   (feat/88 계획과 동일한 결정을 현재 main 기준으로 재적용)

## 범위 밖 (별도 판단)

- `/itinerary`에 조건이 빈 채로(`regions=""`) 도달했을 때의 방어 코드
  (`parsedRegions[0]` undefined → `updateBasketConditions`/`REGION_LABELS` 깨짐)
- 바구니를 전역 드로어로 승격하는 리팩터링

## 구현

| 파일 | 변경 |
|---|---|
| `src/app/basket/page.tsx` | 신규. 메타데이터 + `BasketPageClient` |
| `src/app/basket/_components/BasketPageClient.tsx` | 신규. 바구니 카드 그리드 + 지역 탭 + `BasketLayout` |
| `src/app/basket/_components/BasketPageClient.test.tsx` | 신규 |
| `src/components/layout/Header.tsx` | 바구니 아이콘 `href` `/contents` → `/basket` |
| `src/components/layout/Header.test.tsx` | 위 단언 수정 |
| `src/app/mypage/_components/MyPageClient.tsx` | "여행 바구니" 카드 `href` `/explore` → `/basket` |
| `src/app/mypage/_components/MyPageClient.test.tsx` | 위 단언 수정 |
| `src/app/select/conditions/_components/TravelDateForm.tsx` | 마운트 `clear()` + `useBasket`/`useEffect` import 제거 |
| `src/app/select/conditions/_components/TravelDateForm.test.tsx` | "바구니 초기화" → "바구니 유지"로 뒤집음 |

## 검증

- `bun run lint` / `bunx tsc --noEmit` 통과
- `bun run test` 전체 통과 (62 files / 432 tests)
