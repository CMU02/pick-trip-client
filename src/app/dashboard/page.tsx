import type { Metadata } from "next";

import { getContentFetchErrorMessage } from "@/lib/content";
import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

import { DashboardClient } from "./_components/DashboardClient";

// 로그인한 사용자 개인화 화면이라 검색 결과에 노출될 이유가 없다.
export const metadata: Metadata = {
  robots: { index: false },
};

export default async function DashboardPage() {
  const startDate = new Date().toISOString().split("T")[0];

  let contents: Awaited<ReturnType<typeof getContents>>["contents"] = [];
  let error: string | null = null;

  try {
    const res = await getContents({
      regions: [...REGIONS],
      startDate,
      nights: 0,
    });
    contents = res.contents;
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
      <DashboardClient recommendedPool={contents} />
    </main>
  );
}
