import type { Metadata } from "next";

import { CONTENT_PAGE_SIZE, getContentFetchErrorMessage } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

import { ExploreGrid } from "./_components/ExploreGrid";

export const metadata: Metadata = {
  title: "콘텐츠 둘러보기",
  description:
    "여행 조건을 정하기 전에 하동, 영주, 예천의 관광지·맛집·축제·체험 콘텐츠를 자유롭게 둘러보세요.",
  alternates: { canonical: new URL("/explore", SITE_URL).toString() },
};

export default async function ExplorePage() {
  const startDate = new Date().toISOString().split("T")[0];
  const queryParams = { regions: [...REGIONS], startDate, nights: 0 };

  let contents: Awaited<ReturnType<typeof getContents>>["contents"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    // getContents가 size를 지역별로 쪼개 fan-out 하므로, 첫 화면은 정확히
    // CONTENT_PAGE_SIZE(20)개가 온다(3지역이면 7+7+6).
    const res = await getContents({
      ...queryParams,
      size: CONTENT_PAGE_SIZE,
    });
    contents = res.contents;
    total = res.total;
  } catch (err) {
    error = getContentFetchErrorMessage(err);
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <p className="py-16 text-center text-sm text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <ExploreGrid
        initialContents={contents}
        initialTotal={total}
        queryParams={queryParams}
      />
    </main>
  );
}
