import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

// 콘텐츠 목록은 백엔드에서 오므로 하루 한 번만 다시 만든다.
export const revalidate = 86400;

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${SITE_URL}/explore`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/contents`, changeFrequency: "daily", priority: 0.8 },
  { url: `${SITE_URL}/itinerary`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // ponytail: 지역당 최대 200개만 담는다. 콘텐츠가 그보다 많아지면
    // generateSitemaps로 지역별 분할.
    const { contents } = await getContents({
      regions: [...REGIONS],
      startDate: new Date().toISOString().split("T")[0],
      nights: 0,
      size: 200,
    });

    return [
      ...STATIC_PAGES,
      ...contents.map((content) => ({
        url: `${SITE_URL}/contents/${content.id}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // 백엔드가 죽어도 정적 페이지 사이트맵은 나가야 한다.
    return STATIC_PAGES;
  }
}
