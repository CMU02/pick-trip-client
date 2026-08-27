import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // 로그인이 필요하거나 개인화된 화면은 크롤링 대상이 아니다.
      // /share/[id]는 카카오톡 등의 링크 미리보기를 살려야 해서 여기서 막지
      // 않고, 페이지 자체에 noindex를 준다.
      disallow: [
        "/auth/",
        "/login",
        "/dashboard",
        "/mypage",
        "/favorites",
        "/itineraries",
        "/select/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
