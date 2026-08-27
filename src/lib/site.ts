// 사이트맵, robots, metadataBase가 공유하는 배포 도메인. 배포 환경에
// NEXT_PUBLIC_SITE_URL을 넣지 않으면 로컬 주소로 떨어진다.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
