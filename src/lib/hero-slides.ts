import type { Region } from "@/types/region";

export type HeroSlide = {
  region: Region;
  place: string; // 장소명 — 미정
  image: string; // 미정: public/hero/*.jpg 또는 API 이미지 URL
};

// 이미지·장소명 확정 전까지는 빈 값으로 두고, 화면에서는 단색
// 플레이스홀더로 대체한다. 확정 시 지킬 조건은 docs/plan/hero-region-slider-v2.md
// 4절 참고 (20:11 비율, object-cover, 첫 장만 priority, https 고정).
export const HERO_SLIDES: HeroSlide[] = [
  { region: "HADONG", place: "", image: "" },
  { region: "HADONG", place: "", image: "" },
  { region: "YEONGJU", place: "", image: "" },
  { region: "YEONGJU", place: "", image: "" },
  { region: "YECHEON", place: "", image: "" },
  { region: "YECHEON", place: "", image: "" },
];
