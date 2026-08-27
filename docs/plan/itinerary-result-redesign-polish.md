# 일정 생성/결과 화면 리디자인 마감 + 그라데이션 표준화

핸드오프 README §9(일정 결과)·§11 대조 후 남은 미완성/불일치를 마감한다.
`/itinerary`의 세 화면(생성 전 `PreGenerateView` / 생성 중 `GeneratingState` / 결과
`ItineraryResultLayout`·`ItineraryResult`·`DayCard`·`PlaceItem`)이 대상이다.

## 작업 3 — 일정 결과 화면 (범위: A + B + D)

### A. `PlaceItem` 이동/고정 버튼 이모지 제거
- `▲ ▼ 📌` 이모지를 `Icon`으로 교체. 이모지 사용 금지 규칙 + 핸드오프 Assets 노트("이모지는 임시").
- `icon.tsx`에 `chevron-up`, `pin` path 추가.
- 접근성 이름(`위로 이동`/`아래로 이동`/`고정`/`고정됨`)은 그대로.

### B. `PlaceItem` "삭제" 버튼 아이콘화
- 텍스트 `삭제` → 30px 정사각 `close`(✕) 아이콘 버튼. 스펙 §9의 `↑ ↓ 📌 ✕` 정사각 버튼 셋과 맞춘다.
- **삭제 확인 상태는 유지**: 첫 클릭 시 버튼이 destructive 톤으로 바뀌고 `aria-label`이 "삭제 취소"/재클릭 시 삭제. 텍스트 "정말 삭제?" 대신 색/aria로 표현.
- "대체 장소"는 스펙에 없는 기존 기능이라 텍스트 버튼 유지.

### D. "생성된 일정" 제목 톤
- `ItineraryResult`의 `<h2 className="text-lg font-bold">` → `font-heading` + 스펙 카드 제목 톤(17px, tracking).

### 범위 밖 (문서화된 한계/제약)
- C: `PlaceItem` 좌측 64px 시간 컬럼 — `Item` 타입에 시간/체류 데이터 없음.
- F: 액션 버튼 3개(공유 상시 노출) — 공유는 저장 후에만 itineraryId가 생겨 불가.

## 작업 4 — "일정 완성" 로그인 전/후 통일

`ItineraryClient`의 `loginPreview` phase를 `preview` phase와 시각적으로 통일한다.
- **사이드바**: 안내 문구 박스(`bg-primary/5`) → `preview`와 동일한 `<TripSummary ... showItemList={false} itemCount={...}/>`.
- **액션**: `[로그인하고 계속하기][다시 생성]` 유지(순서·스타일은 이미 `preview`와 동일).
- **"예시입니다" 안내**: 일차 카드 목록 위에 작은 배너로 이동
  (`preview`의 에러 배너 슬롯과 같은 자리). 문구: "이 일정은 예시이며, 로그인하면
  실제로 저장할 수 있어요."
- 일차 카드는 계속 읽기 전용(로그인 전엔 편집 API 사용 불가).

## 작업 5 — 그라데이션 표준화

`PreGenerateView`의 두 그라데이션이 앱 표준보다 진하다. 앱 표준은
`bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)]`
(`/explore` 히어로 "경상도 박스", 대시보드 히어로, 마이페이지, 로그인, 공유, CtaSection 공통).

교체 대상:
- `PreGenerateView` 히어로 `linear-gradient(122deg, L0.64→0.56→0.49)` → 표준
- `PreGenerateView` 생성 CTA `linear-gradient(140deg, L0.63→0.51 hue14)` → 표준
- `FaqSidebar` "찾는 답이 없나요?" CTA `linear-gradient(140deg, ...)` → 표준
  (핸드오프 B절이 이 값을 지정했지만, 앱 전체 톤 일관성을 위해 함께 표준화 — 사용자 확인)

## 테스트

- `PlaceItem.test.tsx`: 접근성 이름 기준이라 아이콘 교체에 영향 없어야 함. 삭제 버튼 aria-label 변경분만 갱신.
- `ItineraryClient.test.tsx`: loginPreview에서 여행 요약(TripSummary) 텍스트가 보이는지 / "예시" 배너 문구 확인.
- 나머지는 텍스트/역할 기준이라 유지.

## 검증

```bash
bun run lint
bun run test
bun run build
```
