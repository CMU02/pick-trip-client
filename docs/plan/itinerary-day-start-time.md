# 하루 시작 시각(dayStartTime) 사용자 지정 — 프론트 선반영

## 배경

일정 생성 결과의 첫 방문 시각(하루 시작 시각)은 지금 백엔드
`SchedulingPolicy.DAY_START = 09:00` 상수로 고정돼 있고, 사용자가 바꿀 방법이
없다. 백엔드에 `dayStartTime` 요청 필드를 추가하기로 했지만(별도 이슈), 이
작업에서는 **프론트 UI·타입·요청 배선만 먼저 만들어 둔다.**

## 중요: 백엔드가 아직 이 필드를 모른다

`GenerateItineraryRequest`(백엔드)는 `@JsonIgnoreProperties(ignoreUnknown = true)`
가 없고 전역 Jackson 설정도 `fail-on-unknown-properties`를 끄지 않는다. 즉
**사용자가 기본값(09:00)에서 시간을 실제로 바꾸면, 지금 배포된 백엔드는 그
요청을 400으로 거부한다.** 바꾸지 않으면 필드 자체가 요청에 안 실리므로
기존 동작과 동일하다(다른 옵션들과 같은 원칙).

**따라서 이 프론트 변경은 백엔드의 대응 필드가 배포되기 전까지 main에
머지·배포하지 않는다.** 브랜치에만 두고, 백엔드 쪽 이슈가 끝나면 함께
연동해 머지한다.

## 작업 내용

1. `src/types/itinerary.ts`
   - `ItineraryGenerateRequest`에 `dayStartTime?: string`("HH:mm") 추가.
     주석에 "백엔드 미지원 — 별도 이슈에서 연동 예정"이라고 남긴다.
2. `PreGenerateView.tsx`
   - "일정 만들기 옵션" 섹션에 "출발 시간" `<input type="time">` 추가.
     기본값 "09:00"(백엔드 기본값과 동일), 범위는 우선 06:00~20:00으로
     둔다(백엔드 검증 규칙이 정해지면 맞춘다).
   - `buildGenerateOptions`가 기본값과 다를 때만 `dayStartTime`을 싣는다
     (mode/startContentId와 같은 패턴).
3. `PreGenerateView.test.tsx`
   - 기본값 유지 시 요청에 안 실리는 것, 바꾸면 실리는 것, 입력 UI 렌더를
     확인하는 테스트 추가.

## 완료 조건

- [ ] 시간을 바꾸지 않으면 요청이 기존과 동일하다(`dayStartTime` 없음).
- [ ] 시간을 바꾸면 요청에 `dayStartTime: "HH:mm"`이 실린다.
- [ ] `bun run lint` · `bun run build` · 관련 테스트 통과.
- [ ] PR 설명에 "백엔드 필드 배포 전까지 머지 보류" 경고를 명시한다.

## 참고 자료

- 사용자와의 대화(2026-09-19)
- 백엔드 변경 스펙(별도 `pick-trip-server` 이슈로 정리 예정): `GenerateItineraryRequest.dayStartTime`
  → `SchedulingContext.dayStartMinute` → `DayScheduler`의 `DAY_START_MINUTE`
  상수 대체 → `ItineraryService`의 `SchedulingContext` 생성부(약 479번째 줄)
  연결.
