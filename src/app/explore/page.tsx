import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

import { ExploreGrid } from "./_components/ExploreGrid";

export default async function ExplorePage() {
  const startDate = new Date().toISOString().split("T")[0];
  const queryParams = { regions: [...REGIONS], startDate, nights: 0 };

  let contents: Awaited<ReturnType<typeof getContents>>["contents"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await getContents(queryParams);
    contents = res.contents;
    total = res.total;
  } catch {
    error = "콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
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
