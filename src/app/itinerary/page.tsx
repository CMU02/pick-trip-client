import type { Metadata } from "next";

import { ItineraryClient } from "./_components/ItineraryClient";

// 입력한 조건에 따라 매번 달라지는 개인화 결과라 검색 결과에 노출될 이유가 없다.
export const metadata: Metadata = {
  title: "AI 일정 생성 | Pick Trip",
  robots: { index: false },
};

interface ItineraryPageProps {
  searchParams: Promise<{
    regions?: string;
    startDate?: string;
    nights?: string;
    companions?: string;
  }>;
}

export default async function ItineraryPage({
  searchParams,
}: ItineraryPageProps) {
  const {
    regions = "",
    startDate = "",
    nights = "0",
    companions = "",
  } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <ItineraryClient
        regions={regions}
        startDate={startDate}
        nights={nights}
        companions={companions}
      />
    </main>
  );
}
