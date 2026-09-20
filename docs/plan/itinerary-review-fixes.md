# 코드리뷰 발견 사항 수정 (실제 버그 + 예상 오류 + 최적화)

## 배경

`5f457be..d171814`(오늘 병합된 #141·#142·#9) 범위를 code-review로 재점검해
발견한 항목 중, 사용자가 우선순위로 지정한 것만 처리한다. TanStack Query
캐싱으로 풀 수 있는 최적화 항목은 대기시키지 않고 함께 처리한다(사용자
지시: "3번은 4번으로 해결").

## 처리할 항목

### 실제 버그
1. `ItineraryClient.tsx`의 `autoResume` 경로가 `handleGenerate()`를 인자
   없이 호출해 `travelModes` 없는 요청을 보냄 → 항상 전체 이동수단을 요청하는
   기본 옵션을 명시적으로 넘긴다.
2. `VariantSelector`에 닫기/취소 동선이 전혀 없음 → X 버튼 + backdrop 클릭 +
   Escape 키로 "다시 생성"(phase idle 복귀)과 동일하게 빠져나가게 한다.
3. "출발" 배지가 `contentId`만 보고 모든 일치 항목에 붙음(재방문 시 중복
   표시) → 첫째 날 첫 항목에만 붙도록 제한한다.
4. `buildLoginPreviewItinerary`(로그인 전 로컬 미리보기)는 시작 장소를
   무시하고 순번대로 배치하는데 배지 매칭은 그대로 시도함 → 이 경로에서는
   시작 장소 배지를 표시하지 않는다.
5. `HeroSlider`가 `window.matchMedia`를 가드 없이 호출(`HowItWorksSection`은
   가드 있음) → 동일하게 `typeof window.matchMedia !== "function"` 가드 추가.
6. `HeroSlider`의 이전/다음 버튼이 렌더 시점 클로저 `index`로 상대 이동을
   계산해 빠른 연속 클릭 시 한 칸만 이동함 → 함수형 `setIndex` 업데이트로 교체.

### 예상 오류(방어 코드)
7. `VariantSelector`가 안이 1개일 때 스스로 렌더를 건너뛰던 내부 가드를
   잃어버림(외부 조건에만 의존) → 컴포넌트 내부에도 복원.
8. `selectedVariantIndex`/`variantChosen` 이중 state가 손으로 동기화돼야
   해서 desync 위험이 있음 → `chosenVariantIndex: number | null` 단일
   state로 통합(`null` = 아직 선택 안 함). 이 통합이 최적화 9번도 해결한다.

### 최적화(요청대로 TanStack Query/병렬화로 해결)
9. `previewDays`/`useItineraryMapData`가 `VariantSelector`가 떠 있는 동안에도
   기본 안(0번) 기준으로 즉시 계산돼 카카오 지도 API를 낭비함 → 8번 통합
   이후 `chosenVariantIndex`가 없으면 `EMPTY_DAYS`를 넘겨 계산 자체를
   건너뛴다.
10. 일정 생성 시 바구니 리컨실(`removeBasketItem`/`addBasketItem` 반복)이
    순차 `await`라 항목 수만큼 응답이 느려짐 → 각 루프를 `Promise.all`로
    병렬화.
11. `AlternativePlacePicker`가 `useEffect` + 수동 `fetch`라 같은 조건으로
    여러 번 열어도 매번 새로 요청함 → `useQuery`로 전환해 `ContentBrowser`와
    같은 캐시 키 패턴을 재사용, 반복 오픈 시 캐시로 즉시 응답.

## 완료 조건

- [ ] 위 11개 항목 모두 반영
- [ ] `bun run lint` · `bun run build` · 관련 테스트(+ 신규 회귀 테스트) 통과
- [ ] 육안으로 VariantSelector 닫기 동선 확인

## 참고 자료

- code-review 서브에이전트 결과(2026-09-19, `5f457be..d171814`)
- 사용자와의 대화(2026-09-19)
