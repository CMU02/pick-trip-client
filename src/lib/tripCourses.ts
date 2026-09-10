// 콘텐츠를 뭘 담아야 할지 모르는 사용자를 위해 이미 장소가 짜여 있는 추천 여행
// 코스. 백엔드/API에 코스 개념이 없어 프론트 큐레이션 상수로 둔다. 홈
// CollectionsSection이 이 배열을 <TripCourseList />로 넘겨 가로 리스트로 보여주고,
// 행을 누르면 spots를 여행 바구니에 담은 채 /itinerary 요약 화면으로 이동한다.
//
// 저장 API가 지역을 하나만 받으므로 코스 1개 = 지역 1개. 장소 id는 로컬 백엔드
// GET /api/v1/contents/{id} 로 실재 확인한 값(2026-09-10 기준). category 는 그때
// 백엔드가 함께 내려준 값 — 요약 화면 배지에만 쓰이고 없어도 폴백 렌더된다.
// TourAPI 카탈로그 변동으로 빠지면 같은 지역·카테고리의 다른 장소로 교체한다.

import type { ContentCategory } from "@/types/content";
import type { Region } from "@/types/region";
import type { CompanionCondition } from "@/types/travel-condition";

export interface TripCourseSpot {
  id: string; // 백엔드 contentId (문자열)
  name: string;
  category?: ContentCategory; // 요약 화면 배지용, 없어도 됨
}

export interface TripCourse {
  slug: string;
  title: string;
  desc: string; // 한 줄 설명
  region: Region;
  nights: number; // 0 = 당일치기
  companions: CompanionCondition[];
  spots: TripCourseSpot[]; // 3~5개
}

export const TRIP_COURSES: TripCourse[] = [
  {
    slug: "hadong-seomjin",
    title: "섬진강 따라, 하동 벚꽃길 1박 2일",
    desc: "평사리 들판과 송림, 쌍계사까지 강을 끼고 걷는 대표 코스",
    region: "HADONG",
    nights: 1,
    companions: [],
    spots: [
      { id: "127665", name: "평사리공원", category: "NATURE" },
      { id: "126233", name: "하동송림공원", category: "NATURE" },
      { id: "128146", name: "쌍계사", category: "CULTURE" },
      { id: "2784765", name: "섬진강식당", category: "FOOD" },
      { id: "231958", name: "하동야생차박물관", category: "CULTURE" },
    ],
  },
  {
    slug: "hadong-tea",
    title: "하동 티 로드, 차 향기 따라 걷는 하루",
    desc: "차박물관에서 제다원, 다원 카페까지 이어지는 당일 코스",
    region: "HADONG",
    nights: 0,
    companions: ["WITH_PARENTS"],
    spots: [
      { id: "130885", name: "매암차박물관", category: "CULTURE" },
      { id: "2781622", name: "매암제다원", category: "FOOD" },
      { id: "791603", name: "도심다원", category: "FOOD" },
      { id: "3442627", name: "티카페하동", category: "FOOD" },
    ],
  },
  {
    slug: "yeongju-seonbi",
    title: "영주, 천년 선비의 길 1박 2일",
    desc: "부석사와 소수서원, 무섬마을을 잇는 고즈넉한 선비 코스",
    region: "YEONGJU",
    nights: 1,
    companions: ["WITH_PARENTS"],
    spots: [
      { id: "127669", name: "부석사", category: "CULTURE" },
      { id: "126201", name: "소수서원", category: "CULTURE" },
      { id: "894087", name: "무섬마을", category: "CULTURE" },
      { id: "2841479", name: "영주축협한우프라자 본점", category: "FOOD" },
      { id: "2832268", name: "태극당", category: "FOOD" },
    ],
  },
  {
    slug: "yeongju-punggi",
    title: "풍기 인삼과 소백산 자락, 영주 당일 나들이",
    desc: "인삼박물관과 생태관찰원을 묶은 가벼운 당일 코스",
    region: "YEONGJU",
    nights: 0,
    companions: [],
    spots: [
      { id: "2406210", name: "인삼박물관", category: "CULTURE" },
      { id: "2616064", name: "여우생태관찰원", category: "NATURE" },
      { id: "2832249", name: "선비꽃이야기", category: "FOOD" },
      { id: "2605878", name: "나드리", category: "FOOD" },
    ],
  },
  {
    slug: "yecheon-family",
    title: "예천 물돌이마을과 곤충나라 (아이와 함께)",
    desc: "회룡포와 생태공원, 곤충생태원까지 아이와 걷기 좋은 코스",
    region: "YECHEON",
    nights: 1,
    companions: ["WITH_KIDS"],
    spots: [
      { id: "126734", name: "회룡포", category: "NATURE" },
      { id: "2716143", name: "예천삼강문화단지 생태공원", category: "NATURE" },
      { id: "2619631", name: "예천 곤충생태원", category: "NATURE" },
      { id: "2912292", name: "예천박물관", category: "CULTURE" },
      { id: "2715994", name: "강문화전시관", category: "CULTURE" },
    ],
  },
];

// 코스 클릭 시 요약 화면 URL에 넣을 기본 출발일: 오늘 + 14일을 "YYYY-MM-DD"로.
// toISOString()은 UTC 기준이라 시간대에 따라 하루 밀릴 수 있어 로컬 연/월/일을
// 각각 읽는다(TravelDateForm.todayDateKey와 같은 방식). 사용자는 요약 화면의
// "조건 수정"에서 바꿀 수 있다.
export function defaultTripStartDate(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 14);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
