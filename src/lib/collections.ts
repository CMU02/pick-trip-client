// 카테고리로는 안 잡히는 상황별 콘텐츠 묶음(아이 동반 · 우천 · 강변 코스).
// 백엔드/API에 컬렉션 개념이 없어 프론트 큐레이션 상수로 둔다. 화면의 "N곳"은
// contentIds.length로 계산하고, 행을 누르면 /explore?ids=… 로 그 콘텐츠만
// 그 순서대로 보여준다(CollectionsSection).
//
// contentIds는 실행 중인 백엔드에서 GET /api/v1/contents를 지역별로 조회해
// 시안 테마에 맞는 실제 id로 채운다. 비어 있는 컬렉션은 CollectionsSection이
// 자동으로 숨기므로, 채우기 전까지 섹션은 렌더되지 않는다.
// 문구는 확정본이 아니다 — id를 채우면서 목록과 안 맞는 설명은 고친다.

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
    desc: "경사가 완만하고 실내 대안이 있는 장소만 모았습니다",
    contentIds: [],
  },
  {
    slug: "wooden-architecture",
    title: "천년 목조건축 순례",
    desc: "부석사 무량수전에서 쌍계사까지",
    contentIds: [],
  },
  {
    slug: "rainy-day",
    title: "비 오는 날의 대안",
    desc: "실내 전시와 체험 위주로",
    contentIds: [],
  },
  {
    slug: "riverside",
    title: "강 따라 걷는 하루",
    desc: "섬진강과 내성천을 잇는 코스",
    contentIds: [],
  },
];
