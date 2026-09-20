# 일정 생성 v2 (다중 일정안·비교 지표·관광객수) 연동 계획

## 배경

백엔드가 이슈 #70~#75, #85 (PR #78~#86, `pick-trip-server` main 머지 완료)로
`POST /api/v1/itineraries/generate` 와 콘텐츠 응답을 확장했다. 기존 호출은 그대로
동작하고, 옵션을 보내면 이동수단별 일정안과 비교 지표가 붙는 **완전 하위호환**
확장이다.

- 팀 가이드(아티팩트): https://claude.ai/code/artifact/0817b9e6-3ec7-4bef-ba39-0860fe0676d4
- 원본 스펙: `pick-trip-server` 저장소 `.agents/docs/api-endpoints.md` (일정 섹션)

## 하위호환 원칙 (모든 작업에 공통)

- 요청 바디를 보내지 않으면 `variants`는 자동차 안 1개뿐이고 최상위
  `title`/`days`/`adjustments`도 지금과 동일하다. **옵션 UI를 붙이지 않은 화면은
  아무것도 안 바뀌어야 한다.**
- 최상위 `title`/`days`/`adjustments`는 `variants[0]`의 복제다. `variants`를
  그리는 화면에서는 최상위 필드를 중복으로 그리지 않는다.
- `metrics`는 모든 안이 같은 키 집합을 반환한다. 값이 없으면 키를 지우지 않고
  `null` + `unavailableReasons`로 사유를 내려준다 — "키 없음"이 아니라 "값이
  `null`"로 산출 불가를 판정해야 한다.
- "해당 없음"과 "산출 불가"는 다르다. `CAR`의 `totalWalkingMinutes`는 항상 `0`
  (사유 코드 없음), 방문 장소가 0~1곳이라 이동 구간이 없으면 교통비는 `null`이
  아니라 `0`원이다. 산출 불가는 현재 `UNKNOWN_TRAVEL_DISTANCE` 하나뿐이다.
- `addedByAi`와 `addedForRest`는 동시에 `true`가 되지 않는다.
- `visitorStats`는 지역(시군구) 단위 근사값이다. 폴백 순서는
  `지역 통계 → 자체 프록시(바구니 담긴 횟수) → null`이며 `approximate`는 항상
  `true`. 개별 장소 단위 실측이 아니라는 점을 UI에 표시해야 한다.
- `startContentId`는 앵커 고정 여부만 결정한다. 지정하지 않아도 일차 배분·순서
  최적화 자체는 항상 수행된다(첫 스톱까지 최적화 대상이 될 뿐).

## 단계별 작업 (이슈/브랜치 순서)

1. **타입/서비스 계층 선반영** — `feat/{issue}`
   - `src/types/itinerary.ts`: generate 요청 옵션 타입(`mode`/`startContentId`/
     `travelModes`), `variants[]`(`label`/`travelMode`/`title`/`days`/
     `adjustments`/`metrics`), `metrics`(`totalTravelMinutes`/
     `totalWalkingMinutes`/`totalTransitCost`/`placeCount`/
     `unavailableReasons`), `suggestions[]`(`CONGESTION_REORDER`), `Item`/
     `RawGeneratedItem`에 `addedByAi?`/`addedForRest?`/`reason?` 추가.
   - `src/types/content.ts`: `Content`에 `visitorStats?: VisitorStats` 추가.
   - `src/services/itineraryService.ts`: `generateItinerary`가 선택 요청 바디를
     받도록 시그니처 변경, `variants[]` 각 안에도 합성 id 부여, 옵션 없이 호출
     시 기존과 동일한 결과가 나오는지 회귀 테스트로 고정.
   - 오래된 주석("generate는 요청 바디를 받지 않는다") 갱신.
2. **일정 생성 요청 옵션 UI** — `feat/{issue}`
   - 여행 조건/바구니 단계에 `mode`(STRICT 기본/AUGMENT), `travelModes`(다중
     선택, 최대 4개, 기본 CAR), `startContentId`(바구니 항목 중 시작점) UI 추가.
3. **다중 일정안 비교 UI** — `feat/{issue}`
   - 이동수단별 `variants[]` 탭/스플릿 뷰, 안별 `metrics` 카드(산출 불가 표시
     포함). `variants` 1개(기존과 동일)일 때 기존 화면과 시각적으로 동일해야
     한다.
4. **자동 추가 항목 배지** — `feat/{issue}`
   - `addedByAi`("AI 추천" 배지, 저장 전 삭제 가능), `addedForRest`("휴식" 배지
     + `reason` 노출).
5. **혼잡 기반 순서변경 제안** — `feat/{issue}`
   - 최상위 `suggestions[]` 배너, 수락 시 순서를 바꾼 `days`로
     `PATCH /api/v1/itineraries/{id}` 호출. 서버는 재정렬하지 않으므로 클라이언트
     책임이다.
6. **콘텐츠 관광객수 표시** — `feat/{issue}`
   - 콘텐츠 카드/상세에 `visitorStats` 노출 + "지역 기준 근사값" 문구, `null`일
     때 레이아웃 안 깨지게 비노출.

1~3은 응답 스키마 핵심이라 순서대로, 4~6은 서로 독립적이라 병렬 진행 가능하다.

## 완료 조건 (공통)

- [ ] 각 브랜치는 `bun run lint` · `bun run build` · 관련 테스트 통과
- [ ] 옵션 미사용 시 기존 화면·응답과 동일함을 회귀 테스트/육안으로 확인
- [ ] PR에 `Closes #{이슈}` 연결
