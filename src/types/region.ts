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

export const ALL_REGIONS_QUERY = REGIONS.join(",");
