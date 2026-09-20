# 이동수단별 다중 일정안 — 결과 화면 카드 선택으로 일원화

## 배경

현재 `PreGenerateView`(생성 전 화면)에 "이동수단" 멀티토글이 있어 사용자가 미리
CAR/TRANSIT 중 만들 안을 고른다. 고른 개수만큼만 `travelModes`를 요청에 실어
보내고, 1개만 고르면 결과 화면에 `VariantSelector` 카드 자체가 뜨지 않는다.

사용자 피드백: 이동수단을 미리 고르게 하지 말고, 항상 전체 이동수단으로 안을
만들어서 결과 화면의 카드에서 고르는 방식 하나로 통일한다. 카드 UI는 기존
디자인 비율을 유지한 채 1.5배 확대한다.

## 작업 내용

1. `PreGenerateView.tsx`
   - "이동수단" 섹션(멀티토글 UI, 안내 문구, `travelModes`/`toggleTravelMode`
     상태, `TRAVEL_MODE_OPTIONS` 렌더) 제거.
   - `buildGenerateOptions`가 이동수단은 항상 `TRAVEL_MODE_LABELS`의 전체 키
     (`CAR`, `TRANSIT`)를 요청하도록 고정. 사용자가 더 바꿀 수 없으므로 별도
     state 없이 상수로 취급.
2. `PreGenerateView.test.tsx`
   - 이동수단 토글 관련 테스트("이동수단은 최소 1개를 유지한다…") 제거.
   - 옵션 요청 바디에 항상 `travelModes: ["CAR", "TRANSIT"]`가 실리는지 확인하는
     테스트로 대체.
3. `VariantSelector.tsx`
   - 카드 폭/내부 여백/폰트/아이콘 크기를 전부 1.5배로 스케일(비율 유지). 모달
     최대 폭(`max-w-3xl`)도 카드 2장 + 간격이 들어가도록 함께 늘림.
   - `VariantSelector.test.tsx`는 로직 변경이 없으므로 스타일 스냅샷성 검증은
     없다는 전제하에 그대로 둔다(별도 실패 없으면 수정 불필요).

## 완료 조건

- [ ] `PreGenerateView`에 이동수단 선택 UI가 없다.
- [ ] 일정 생성 요청은 항상 CAR·TRANSIT 두 안을 요청해 결과 화면에 항상
      `VariantSelector` 카드 선택 화면이 뜬다(안이 1개로 줄어드는 경우 없음).
- [ ] `VariantSelector` 카드가 기존 비율을 유지한 채 1.5배 크기로 보인다.
- [ ] `bun run lint` · `bun run build` · 관련 테스트 통과.

## 참고 자료

- 관련 논의: 사용자와의 대화(2026-09-19), 기존 `docs/plan/itinerary-generate-v2.md`
