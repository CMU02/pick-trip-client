import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

import { DashboardClient } from "./_components/DashboardClient";

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
  } catch {
    error = "콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
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
