import type { Region } from "@/types/region";

export type HeroSlide = {
  region: Region;
  place: string; // 장소명 — 미정
  image: string; // 미정: public/hero/*.jpg 또는 API 이미지 URL
};

// 지역별 대표 사진 2장(사용자 확정, VisitKorea 원본). 외부 URL은
// docs/plan/hero-region-slider-v2.md 4절 조건에 따라 https로 고정한다.
export const HERO_SLIDES: HeroSlide[] = [
  {
    region: "HADONG",
    place: "삼성궁",
    image: "https://tong.visitkorea.or.kr/cms/resource/28/3535228_image2_1.jpg",
  },
  {
    region: "HADONG",
    place: "정금차밭",
    image: "https://tong.visitkorea.or.kr/cms/resource/45/3465045_image2_1.JPG",
  },
  {
    region: "YEONGJU",
    place: "소백산",
    image: "https://tong.visitkorea.or.kr/cms/resource/16/3502116_image2_1.jpg",
  },
  {
    region: "YEONGJU",
    place: "소수서원",
    image: "https://tong.visitkorea.or.kr/cms/resource/85/3499385_image2_1.JPG",
  },
  {
    region: "YECHEON",
    place: "초간정",
    image: "https://tong.visitkorea.or.kr/cms/resource/01/3542701_image2_1.jpg",
  },
  {
    region: "YECHEON",
    place: "병암정",
    image: "https://tong.visitkorea.or.kr/cms/resource/83/3542683_image2_1.jpg",
  },
];
