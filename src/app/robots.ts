import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// 로그인·개인화 화면과 서버 경계(OAuth 콜백, API 프록시)는 색인 대상이 아니다.
// 접두사로 매칭되므로 /dashboard 하나로 /dashboard/for-you까지 함께 막힌다.
const DISALLOWED_PATHS = [
  "/dashboard",
  "/favorites",
  "/itineraries",
  "/itinerary",
  "/login",
  "/mypage",
  "/select",
  "/share",
  "/auth",
  "/api",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOWED_PATHS,
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
