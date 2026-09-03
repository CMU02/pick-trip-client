export type Region = "HADONG" | "YEONGJU" | "YECHEON";

export const REGIONS = ["HADONG", "YEONGJU", "YECHEON"] as const;

export const REGION_LABELS: Record<Region, string> = {
  HADONG: "하동",
  YEONGJU: "영주",
  YECHEON: "예천",
};

export const REGION_DESCRIPTIONS: Record<Region, string> = {
  HADONG: "천년 야생차의 향기와 맑은 강물이 어우러진 휴식과 힐링의 공간",
  YEONGJU: "소백산 노을과 천년 고찰 부석사의 고즈넉함이 머무는 선비의 고장",
  YECHEON: "강과 산이 어우러져 첫눈에 반하게 되는 숨은 보석 같은 공간",
};

// 지역 카드 대표 이미지(VisitKorea 원본). 지역 콘텐츠에는 대표 이미지 필드가
// 없어 홈 지역 카드용으로 직접 지정한다. 호스트(tong.visitkorea.or.kr)는
// next.config의 IMAGE_HOSTS·CSP img-src에 이미 열려 있다.
export const REGION_IMAGE_URLS: Record<Region, string> = {
  HADONG: "http://tong.visitkorea.or.kr/cms/resource/35/3351935_image2_1.jpg",
  YEONGJU: "https://tong.visitkorea.or.kr/cms/resource/53/3572453_image2_1.JPG",
  YECHEON: "http://tong.visitkorea.or.kr/cms/resource/11/3542711_image2_1.jpg",
};

export const ALL_REGIONS_QUERY = REGIONS.join(",");
