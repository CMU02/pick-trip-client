# 시작 지점 기반 동선 최적화 — 동기화 버그 및 표시 누락 해결

## 배경

`PreGenerateView`의 "시작 장소" select(`startContentId`)에 두 가지 문제가
있다.

1. 선택한 장소를 바구니에서 지워도 `startContentId` state가 그대로 남아,
   존재하지 않는 콘텐츠 id가 생성 요청에 실려 나간다.
2. 생성 요청에 쓴 `startContentId`는 요청 한 번 보내고 버려져, 결과 화면
   어디에도 "이 장소가 시작점으로 고정됐다"는 표시가 없다.

## 작업 내용

1. `PreGenerateView.tsx`
   - `items` 목록에 더 이상 `startContentId`가 없으면(바구니에서 삭제됨)
     자동으로 `""`(AI가 자동으로 정함)로 되돌리는 동기화 로직 추가.
2. `ItineraryClient.tsx`
   - `handleGenerate`가 받은 `options.startContentId`를 상태로 보관.
   - 결과 렌더링 시 해당 콘텐츠 id를 하위 컴포넌트(`DayCard`/`PlaceItem`)로
     전달.
3. `PlaceItem.tsx` / `DayCard.tsx`
   - 보관된 시작 장소 id와 일치하는 항목에 "고정"/"AI 추천"/"휴식" 배지와
     같은 자리에 "출발" 배지 추가. 저장된 일정(재조회) 경로는 원래 요청값을
     모르므로 배지를 표시하지 않는다(신규 생성 직후 화면에서만 표시).
4. 관련 테스트(`PreGenerateView.test.tsx`, `ItineraryClient.test.tsx`,
  `PlaceItem.test.tsx`) 추가/보강.

## 완료 조건

- [ ] 시작 장소를 고른 뒤 바구니에서 그 항목을 지우면 select가 "AI가
      자동으로 정함"으로 즉시 돌아간다.
- [ ] 시작 장소를 지정해 생성하면 결과 화면에서 해당 장소에 "출발" 배지가
      보인다.
- [ ] `bun run lint` · `bun run build` · 관련 테스트 통과.

## 참고 자료

- 관련 논의: 사용자와의 대화(2026-09-19)
- 백엔드 정책: `pick-trip-server` `.agents/docs/key-features.md` "시작 지점 기반
  동선 최적화" 절
