import type { Metadata } from "next";

import { ItineraryClient } from "./_components/ItineraryClient";

export const metadata: Metadata = {
  title: "AI 일정 생성 | Pick Trip",
};

interface ItineraryPageProps {
  searchParams: Promise<{
    regions?: string;
    startDate?: string;
    nights?: string;
    companions?: string;
    // 로그인 후 이 화면으로 되돌아왔음을 표시(로그인 전 미리보기에서 넘긴다).
    resume?: string;
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
    resume = "",
  } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <ItineraryClient
        regions={regions}
        startDate={startDate}
        nights={nights}
        companions={companions}
        autoResume={resume === "1"}
      />
    </main>
  );
}
