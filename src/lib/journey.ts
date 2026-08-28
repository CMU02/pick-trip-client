// 일정을 만드는 여정의 3단계 공식 라벨. 홈 StepsSection, 대시보드
// ProgressStepper, 생성 흐름의 "Step N" 표기가 모두 이 상수를 참조한다.
// (생성 흐름의 마지막 화면 = 일정 결과는 3단계의 "완료" 상태이지 별도 단계가 아니다.)
export const JOURNEY_STEPS = [
  {
    n: 1,
    label: "여행 조건",
    desc: "가고 싶은 지역과 출발일, 기간을 고릅니다.",
  },
  {
    n: 2,
    label: "콘텐츠 담기",
    desc: "마음에 드는 장소를 바구니에 담고 우선순위를 정합니다.",
  },
  {
    n: 3,
    label: "AI 일정 생성",
    desc: "이동 거리와 운영 시간을 고려한 일정이 만들어집니다.",
  },
] as const;
