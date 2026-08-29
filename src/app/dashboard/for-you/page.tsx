import type { Metadata } from "next";

import { CONTENT_PAGE_SIZE, getContentFetchErrorMessage } from "@/lib/content";
import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

import { ForYouClient } from "./_components/ForYouClient";

// 로그인한 사용자 개인화 화면이라 검색 결과에 노출될 이유가 없다.
export const metadata: Metadata = {
  robots: { index: false },
};

export default async function ForYouPage() {
  const startDate = new Date().toISOString().split("T")[0];
  const queryParams = { regions: [...REGIONS], startDate, nights: 0 };

  let contents: Awaited<ReturnType<typeof getContents>>["contents"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    // getContents가 size를 지역별로 쪼개 fan-out 하므로, 첫 화면은 정확히
    // CONTENT_PAGE_SIZE(20)개가 온다 (ExplorePage와 동일).
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
      <main className="mx-auto w-full max-w-7xl px-4 py-14">
        <p className="py-16 text-center text-sm text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14">
      <ForYouClient
        initialContents={contents}
        initialTotal={total}
        queryParams={queryParams}
      />
    </main>
  );
}
