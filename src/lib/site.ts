// 공유 카드(og:image, og:url)·canonical·sitemap처럼 절대 URL이 필요한
// 메타데이터의 기준 origin. 배포 환경에서는 NEXT_PUBLIC_SITE_URL로 덮어쓴다.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pick-trip.app";
