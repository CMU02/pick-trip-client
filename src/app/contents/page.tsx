import { formatDuration } from "@/lib/itinerary";
import { getContents } from "@/services/contentService";
import { REGION_LABELS, type Region } from "@/types/region";

import { ContentGrid } from "./_components/ContentGrid";

interface ContentsPageProps {
  searchParams: Promise<{
    regions?: string;
    startDate?: string;
    nights?: string;
    companions?: string;
  }>;
}

// "하동 · 2026년 9월 12일 (토) · 1박 2일" 형태의 조건 요약 한 줄.
function formatConditionLine(
  regions: string,
  startDate: string,
  nights: string,
) {
  const regionText = regions
    ? regions
        .split(",")
        .map((r) => REGION_LABELS[r as Region] ?? r)
        .join(", ")
    : "전체 지역";
  const dateText = startDate
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(new Date(startDate))
    : "날짜 미선택";
  const durationText = formatDuration(Number(nights) || 0);
  return `${regionText} · ${dateText} · ${durationText}`;
}

export default async function ContentsPage({
  searchParams,
}: ContentsPageProps) {
  const {
    regions = "",
    startDate = "",
    nights = "0",
    companions,
  } = await searchParams;

  const queryParams = {
    regions: regions ? regions.split(",") : [],
    startDate,
    nights: Number(nights),
    companions: companions ? companions.split(",") : undefined,
  };

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

  const itineraryHref = `/itinerary?${new URLSearchParams({
    regions,
    startDate,
    nights,
    ...(companions ? { companions } : {}),
  }).toString()}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <ContentGrid
        initialContents={contents}
        initialTotal={total}
        queryParams={queryParams}
        itineraryHref={itineraryHref}
        conditionLine={formatConditionLine(regions, startDate, nights)}
      />
    </main>
  );
}
