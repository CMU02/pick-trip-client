# 로그인 전 AI 일정 생성 후 바구니 비우기

## 문제

로그인하지 않은 상태에서 AI 일정을 생성하면(`generate`가 `AUTH_REQUIRED`로 실패해
바구니 기반 로컬 미리보기 `loginPreview`로 전환) **로컬 바구니가 비워지지 않는다.**
- 로그인 이후 흐름은 생성 성공 시 `clearBasket()`으로 비운다.
- 그래서 로그인 전에는 뒤로 가서 다시 생성하려 하면 이전에 담아둔 콘텐츠가 그대로 남아 있다.

## 방침 (사용자 결정)

1. **생성 시 즉시 비운다** — `loginPreview`로 전환하는 순간에도 `clearBasket()`.
   로그인 이후 흐름과 동일. 생성 페이지를 그냥 벗어나면(브라우저 뒤로가기 등) 다른
   화면(`/contents`, `/basket`)에 담아둔 상태가 남지 않는다.
2. **로그인 버튼을 누를 때만 복원** — 비우기 직전 바구니 스냅샷을 `ref`에 남겨두고,
   "로그인하고 계속하기"를 누를 때만 `saveBasket(snapshot)`으로 복원한다. 로그인 후
   진짜 생성에는 바구니 항목이 필요하기 때문. "다시 생성"은 복원하지 않는다(로그인
   이후 성공 시와 동일하게 비운 상태로 PreGenerateView로 이동 — 빈 상태 안내가 뜬다).
3. **로그인 후 복귀 시 자동 재생성** — 로그인 링크에 `resume=1`을 붙이고, 복귀한
   `/itinerary`에서 `autoResume && phase===idle && items.length>=2`이면 마운트 직후
   `handleGenerate()`를 한 번 자동 호출한다. 버튼을 다시 누르지 않아도 된다.

## 서버 바구니

로그인 전에는 `Authorization` 헤더가 없어 `updateBasketConditions`(생성 시퀀스의 첫
서버 호출)부터 401로 실패한다 → **서버 바구니에는 아무것도 기록되지 않는다.** 정리할
서버 상태 없음. (서버 바구니 누적 문제는 로그인 이후 흐름의 별건 — `0892a31`에서 완화됨.)

## 구현

- `src/app/itinerary/page.tsx`: `searchParams.resume` 추가 → `autoResume={resume === "1"}` prop 전달.
- `src/app/itinerary/_components/ItineraryClient.tsx`:
  - `useBasket()`에서 `save: saveBasket` 추가 수신.
  - `preLoginBasketRef` (비우기 전 스냅샷), `autoResumeTriggered` ref.
  - `loginNext`에 `resume: "1"` 추가.
  - `handleGenerate` onError `AUTH_REQUIRED`: `preLoginBasketRef.current = items; clearBasket();` 후 loginPreview.
  - loginPreview "로그인하고 계속하기" `<Link onClick>` → `saveBasket(preLoginBasketRef.current)`.
  - loginPreview `TripSummary`의 `items`를 `preLoginBasketRef.current`로.
  - autoResume `useEffect`.

## 테스트

- `ItineraryClient.test.tsx`:
  - AUTH_REQUIRED → loginPreview 시 `clearBasket` 호출됨(기존 `not.toHaveBeenCalled` 뒤집기).
  - "로그인하고 계속하기" 클릭 → `saveBasket`가 스냅샷(2개)으로 호출, 링크에 `resume=1`.
  - `autoResume` prop이면 버튼 없이 자동 생성 → "생성된 일정" 표시.

## 검증

```bash
bun run lint
bun run test
bun run build
```
