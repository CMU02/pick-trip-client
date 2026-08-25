// 공유 카드(og:image, og:url)처럼 절대 URL이 필요한 메타데이터의 기준 origin.
// 실제 배포 도메인은 저장소에 두지 않고 NEXT_PUBLIC_SITE_URL로 주입한다.
// 값이 없으면 Next.js의 기본 동작과 같은 로컬 개발 주소로 떨어진다.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
