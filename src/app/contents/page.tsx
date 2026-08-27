import type { Metadata } from "next";

import { distributePageSize, getContentFetchErrorMessage } from "@/lib/content";
import { formatDuration } from "@/lib/itinerary";
import { SITE_URL } from "@/lib/site";
import { getContents } from "@/services/contentService";
import { ALL_REGIONS_QUERY, REGION_LABELS, type Region } from "@/types/region";

import { ContentGrid } from "./_components/ContentGrid";

// 조건은 searchParams마다 달라지지만 페이지 성격은 고정이라 정적 metadata로 둔다.
// 검색 조건 쿼리스트링마다 별도 페이지로 취급되지 않도록 canonical은 조건 없는 목록으로 모은다.
export const metadata: Metadata = {
  title: "여행 콘텐츠 고르기",
  description:
    "선택한 지역과 여행 조건에 맞는 하동, 영주, 예천의 여행 콘텐츠를 골라 일정에 담아보세요.",
  alternates: { canonical: new URL("/contents", SITE_URL).toString() },
};

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

  // 헤더의 바구니 링크처럼 조건 없이 /contents로 들어오는 경로가 있다. 이때
  // 빈 조건 그대로 조회하면 결과가 항상 0건이라, 목록 조회에 한해 /explore와
  // 같은 기본값(전체 지역 · 오늘 출발)으로 채워 목록과 바구니 패널을 보여준다.
  const hasConditions = Boolean(regions && startDate);

  const queryParams = {
    regions: (regions || ALL_REGIONS_QUERY).split(","),
    startDate: startDate || new Date().toISOString().split("T")[0],
    nights: Number(nights),
    companions: companions ? companions.split(",") : undefined,
  };

  let contents: Awaited<ReturnType<typeof getContents>>["contents"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    // getContents는 지역마다 같은 size로 fan-out 하므로, size를 그대로
    // 두면 첫 화면부터 20개가 아니라 20개 × 지역 수가 온다. 지역 수만큼
    // 나눠 요청해 첫 페이지도 대략 20개로 맞춘다.
    const res = await getContents({
      ...queryParams,
      size: distributePageSize(queryParams.regions.length),
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

  // 목록 조회용 기본값은 사용자가 고른 조건이 아니므로 일정 생성으로 넘기지
  // 않는다. ItineraryClient는 이 쿼리를 그대로 서버 바구니 조건에 덮어써
  // 고른 적 없는 "하동 당일치기"로 생성해 버린다. 조건이 없을 때는
  // /dashboard/for-you, /favorites와 같이 조건 선택 화면으로 보낸다.
  const itineraryHref = hasConditions
    ? `/itinerary?${new URLSearchParams({
        regions,
        startDate,
        nights,
        ...(companions ? { companions } : {}),
      }).toString()}`
    : `/select/conditions?regions=${ALL_REGIONS_QUERY}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <ContentGrid
        initialContents={contents}
        initialTotal={total}
        queryParams={queryParams}
        itineraryHref={itineraryHref}
        conditionLine={
          hasConditions
            ? formatConditionLine(regions, startDate, nights)
            : "전체 지역 · 여행 조건 미선택"
        }
      />
    </main>
  );
}
