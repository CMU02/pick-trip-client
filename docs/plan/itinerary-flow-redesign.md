# 일정 생성/조회 화면 코랄 리디자인

## Context

전체 화면 리디자인([[home-redesign]], [[dashboard-redesign]], [[explore-contents-redesign]]에 이어). **1차 작업은 디자인 핸드오프 문서(`design_handoff_picktrip_redesign/PickTrip 전체 화면.dc.html`, 3번 "지역·조건 선택"·8번 "저장한 일정"·9번 "일정 결과" 섹션)를 확인하지 않고 색상 위주로만 손댄 것으로 확인되어, 이번에 핸드오프 원본 기준으로 재작업한다.** 사용자가 직접 지적한 캘린더 미구현이 계기였다.

`/select/conditions`, `/itinerary`, `/itineraries`를 대상으로 한다.

## 정책 충돌로 확인만 하고 넘어간 것

**여행조건 페이지의 지역 다중 선택 블록.** 핸드오프 3번 화면엔 지역 3열 선택 카드가 캘린더 위에 있어 이 페이지에서 지역을 바꿀 수 있지만, 실제 앱은 지역을 홈 카드 클릭으로 이미 확정하고 이 페이지엔 지역 선택 UI가 없다. 사용자 확인 결과 **추가하지 않기로** 했다 — 선택 요약 사이드바에 읽기 전용으로만 지역을 보여준다.

## 데이터 한계로 구현하지 않은 것

- 일차 카드 항목의 시간(`i.time`)/체류시간(`i.stay`)/카테고리 배지 — `Item` 타입에 해당 필드가 없음(타입 주석에 이미 "백엔드 Item 스키마에는 startTime/endTime/stayDuration이 없다"고 명시돼 있었음)
- "이동 거리 합계" 카드 — 서버가 이동 거리를 내려주지 않음(핸드오프 README도 데이터 없으면 빼도 된다고 명시)
- 저장한 일정 행의 "일정 열기" 버튼 — 저장된 일정을 여는 별도 페이지/라우트가 없어(기존엔 인라인 펼치기가 유일한 진입점), 새 라우트를 만드는 대신 기존 "보기" 토글 버튼을 스펙 톤(코랄 solid)으로 스타일만 올렸다

## 구현

### TravelDateCalendar.tsx — 신규(핵심)
- 월 이동(←/→), 요일 헤더(일=코랄톤/토=블루톤), 7열 날짜 그리드
- 출발일 클릭 → `nights`만큼 자동으로 범위 하이라이트(시작/종료=코랄 solid+흰 점, 중간=연한 코랄). 라운드 규칙(시작 `12px 4px 4px 12px`, 종료 `4px 12px 12px 4px`, 중간 `4px`, 당일치기 `12px`)까지 반영
- 스펙엔 없지만 기존 `<input type="date" min={today}>`의 "과거 날짜 선택 불가" 제약은 실제 예약 로직상 유지(과거 날짜는 비활성화)
- 기존 `StartDateInput.tsx`는 삭제

### DurationSelector.tsx / CompanionSelector.tsx
- 선택 상태를 소프트 코랄(`bg-accent`)에서 솔리드 코랄(`bg-primary`)로 수정 — 핸드오프가 두 곳 모두 선택 시 코랄 solid를 쓰는 것을 확인해 반영
- 기간 프리셋을 캘린더 카드 안(구분선 아래)으로 이동, 숙박 입력을 텍스트 입력 → −/+ 스테퍼로 변경

### TravelDateForm.tsx / select/conditions/page.tsx
- `1fr/380px` 2단 레이아웃: 좌측(캘린더+기간, 동행 조건) / 우측 sticky 선택 요약 카드(지역/날짜/기간/동행조건 4행 + 다음 버튼 + 힌트)
- "담은 콘텐츠" 행은 이 단계에서 바구니가 항상 비어 있어(콘텐츠 담기는 다음 페이지) 의미가 없다고 판단해 요약에서 제외

### DayCard.tsx / PlaceItem.tsx
- `DayCard`: 34px 코랄 번호 타일 + "N일차" + "N곳" 카운트로 헤더 재구성(기존엔 배지+텍스트가 한 pill이었음)
- `PlaceItem`: 이동/고정/삭제 버튼을 30px 정사각 아이콘 버튼으로, 접근성 이름은 기존 테스트와 동일하게 유지(`위로 이동`/`아래로 이동`/`고정`/`대체 장소`/`삭제`). "대체 장소" 버튼은 핸드오프엔 없지만 기존 기능(`AlternativePlacePicker`)이라 유지

### TripSummary.tsx
- 우선순위 선택 배지를 3색(`PRIORITY_SELECTED_CLASSES`)에서 코랄 단색으로 통일 — [[explore-contents-redesign]]의 `BasketPanel`과 동일한 근거(핸드오프가 선택 여부만 코랄로 구분하고 라벨 문구로 우선순위를 구분)
- `showItemList` prop 추가: 일정 생성 결과 화면 사이드바에서는 담은 콘텐츠가 이미 일차 카드에 다 나와 있어 개수만 표시(중복 방지)

### ItineraryClient.tsx / SavedItinerariesList.tsx / GeneratingState.tsx
- `ItineraryResultLayout`(신규 내부 컴포넌트): "STEP 3 · 일정 완성" 헤더 + 액션 버튼 + `1fr/320px`(일차 카드 | 여행 요약 사이드바) 레이아웃을 preview/saving/saved/loginPreview phase에 공통 적용
- 액션 버튼: 미리보기 단계는 "다시 생성"(outline)+"저장"(코랄 solid) 2개만 노출(공유는 저장 전엔 itineraryId가 없어 불가능 — 스펙은 3버튼을 항상 보여주지만 실제 앱 제약상 저장 후에만 공유 버튼 노출)
- `SavedItinerariesList`: 좌측 아이콘 칩 → 58px 코랄 그라데이션 타일(지역/기간 표시), "N일 전 저장" 상대시간 추가, "보기/접기" 토글을 코랄 solid 버튼으로
- `GeneratingState`: 스피너 5px 두께·전체 여백을 스펙 값에 맞춤

## 테스트

- `TravelDateCalendar.test.tsx`: 신규 — 헤더 연/월 표시, 날짜 클릭 시 `onSelect` 호출, 월 이동, 과거 날짜 비활성화
- `TravelDateForm.test.tsx`: 네이티브 date input → 캘린더 클릭 상호작용으로 전면 재작성
- `SavedItinerariesList.test.tsx`: 지역·기간 텍스트가 여러 요소로 나뉘어 표시되도록 검증 방식 조정
- 나머지는 접근성 이름/텍스트 기준 테스트가 구조 변경에 영향받지 않아 그대로 유지

## 검증

```bash
bun run test
bun run lint
bun run build
```
