import type { NextConfig } from "next";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const isDev = process.env.NODE_ENV === "development";

// VisitKorea 원본 이미지 호스트. next/image 최적화를 거치면 same-origin
// (/_next/image)으로 서빙되지만, 최적화를 끈 경로나 원본 URL을 그대로 쓰는
// 화면이 생겨도 이미지가 차단되지 않도록 img-src에 함께 열어둔다.
// 프로덕션은 upgrade-insecure-requests가 http 요청을 https로 올리지만,
// 그 지시어가 없는 dev를 위해 http 스킴도 함께 둔다.
const IMAGE_HOSTS =
  "https://tong.visitkorea.or.kr http://tong.visitkorea.or.kr";

// Kakao 지도 SDK 예외. SDK 진입점은 dapi.kakao.com 이고, 이후 지도 엔진
// 스크립트·스타일·래스터 타일·마커 스프라이트를 Daum CDN(*.daumcdn.net)에서
// 받아온다. 길찾기(apis-navi.kakaomobility.com)는 서버 Route Handler
// (/api/directions)에서만 호출하므로 REST 키가 브라우저에 노출되지 않고
// connect-src 도 dapi.kakao.com 만 열면 된다. JS 키는 Kakao 콘솔에서 도메인
// 제한을 건다.
// SDK 진입점(dapi.kakao.com)은 https지만, 그 다음 로드하는 지도 엔진
// 스크립트·스타일(t1.daumcdn.net)은 프로토콜 상대 URL이라 페이지 origin을
// 따라간다. https가 없는 dev(http://localhost)에서는 http로 요청되므로
// script-src/style-src에도 http 스킴을 함께 열어야 kakao.maps.load가 끝난다.
const KAKAO_SCRIPT_HOSTS = `https://dapi.kakao.com https://t1.daumcdn.net https://*.daumcdn.net${
  isDev ? " http://t1.daumcdn.net http://*.daumcdn.net" : ""
}`;
const KAKAO_STYLE_HOSTS = `https://t1.daumcdn.net https://*.daumcdn.net${
  isDev ? " http://t1.daumcdn.net http://*.daumcdn.net" : ""
}`;
const KAKAO_IMG_HOSTS = `https://*.daumcdn.net https://t1.daumcdn.net https://dapi.kakao.com${
  isDev ? " http://*.daumcdn.net" : ""
}`;
const KAKAO_CONNECT_HOSTS = "https://dapi.kakao.com";

// 브라우저 리소스는 Kakao 지도(위 KAKAO_* 예외)를 빼면 전부 same-origin이다.
// - 스크립트/스타일: Next.js와 next/font가 셀프 호스팅한다. (Kakao 지도 SDK만 외부 CDN)
// - API: apiClient가 브라우저에서 상대 경로로 요청하고 아래 rewrites가 백엔드로
//   프록시하므로 connect-src는 'self' + dapi.kakao.com 으로 충분하다.
// - OAuth: /auth/{google,kakao}/start의 서버 리다이렉트로 백엔드 origin까지
//   전체 페이지 이동한다. 최상위 내비게이션은 CSP 지시어 대상이 아니라
//   form-action 'self'와 무관하게 로그인 플로우가 유지된다.
//
// 'unsafe-inline'을 남긴 이유:
// - script-src: App Router가 RSC 페이로드를 매 페이지 인라인
//   <script>self.__next_f.push(...)</script>로 심는다. nonce로 대체하려면
//   proxy.ts와 전 페이지 동적 렌더링이 필요해 정적 생성을 포기해야 한다.
// - style-src: next/image가 붙이는 style="color:transparent" 등 인라인 style
//   속성이 같은 이유로 nonce 없이는 허용이 필요하다.
// dev에서만 필요한 것:
// - 'unsafe-eval': React가 서버 에러 스택 복원을 위해 eval을 쓴다.
// - ws:: HMR 웹소켓.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${KAKAO_SCRIPT_HOSTS}`,
  `style-src 'self' 'unsafe-inline' ${KAKAO_STYLE_HOSTS}`,
  `img-src 'self' blob: data: ${IMAGE_HOSTS} ${KAKAO_IMG_HOSTS}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""} ${KAKAO_CONNECT_HOSTS}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // 개발 중 같은 네트워크의 다른 기기(모바일 등)에서 접속할 때
  // HMR 등 dev 리소스 요청이 cross-origin으로 차단되지 않도록 허용한다.
  // allowedDevOrigins는 도메인 와일드카드와 같은 방식(점으로 구분된 세그먼트 단위 "*")으로
  // IPv4 주소도 매칭하므로, 개별 IP 대신 사설 네트워크 대역 전체를 패턴으로 등록한다.
  // - 192.168.0.0/16, 10.0.0.0/8은 세그먼트 2개가 고정이라 와일드카드 1개로 표현 가능
  // - 172.16.0.0/12는 두 번째 옥텟이 16~31 범위라 와일드카드로 한 번에 표현할 수 없어 나열한다
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "tong.visitkorea.or.kr",
      },
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
      },
    ],
  },
  async headers() {
    return [
      {
        // 모든 응답에 공통 보안 헤더를 붙인다.
        source: "/(.*)",
        headers: [
          // MIME 스니핑을 막아 업로드/프록시된 응답이 스크립트로 해석되지 않게 한다.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // frame-ancestors를 이해하지 못하는 구형 브라우저용 클릭재킹 방어.
          { key: "X-Frame-Options", value: "DENY" },
          // 외부 도메인으로는 origin만, 다운그레이드 시에는 아무것도 보내지 않는다.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
