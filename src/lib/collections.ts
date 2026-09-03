// 카테고리로는 안 잡히는 상황별 콘텐츠 묶음(아이 동반 · 우천 · 강변 코스).
// 백엔드/API에 컬렉션 개념이 없어 프론트 큐레이션 상수로 둔다. 화면의 "N곳"은
// contentIds.length로 계산하고, 행을 누르면 /explore?ids=… 로 그 콘텐츠만
// 그 순서대로 보여준다(CollectionsSection).
//
// contentIds는 백엔드 GET /api/v1/contents 지역별 목록에서 시안 테마에 맞는
// 실제 콘텐츠를 골라 채운 값(2026-08-30 기준). 비어 있는 컬렉션은
// CollectionsSection이 자동으로 숨긴다.

export interface HomeCollection {
  slug: string;
  title: string;
  desc: string;
  contentIds: string[];
}

export const HOME_COLLECTIONS: HomeCollection[] = [
  {
    slug: "with-kids",
    title: "아이와 함께 걷기 좋은 곳",
    desc: "생태원·박물관 위주로, 걷기 편하고 실내 대안이 있는 곳",
    // 예천 곤충생태원 · 지리산생태과학관 · 여우생태관찰원 · 예천박물관 · 하동야생차박물관
    contentIds: ["2619631", "2515791", "2616064", "2912292", "231958"],
  },
  {
    slug: "wooden-architecture",
    title: "천년 목조건축 순례",
    desc: "부석사에서 쌍계사까지, 오래된 목조 건축을 잇는 길",
    // 부석사 · 영주 소수서원 · 무섬마을 · 쌍계사(하동)
    contentIds: ["127669", "126201", "894087", "128146"],
  },
  {
    slug: "rainy-day",
    title: "비 오는 날의 대안",
    desc: "실내 전시관 위주로 묶은 우천 코스",
    // 매암차박물관 · 인삼박물관 · 강문화전시관
    contentIds: ["130885", "2406210", "2715994"],
  },
  {
    slug: "riverside",
    title: "강 따라 걷는 하루",
    desc: "섬진강과 내성천을 잇는 물길 산책 코스",
    // 평사리공원 · 하동송림공원 · 예천삼강문화단지 생태공원 · 회룡포
    contentIds: ["127665", "126233", "2716143", "126734"],
  },
];
