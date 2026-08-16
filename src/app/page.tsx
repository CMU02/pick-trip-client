import type { Metadata } from "next";

import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";
import { CtaSection } from "./_components/CtaSection";
import { HeroSection } from "./_components/HeroSection";
import { HomeGate } from "./_components/HomeGate";
import { RegionShowcase } from "./_components/RegionShowcase";
import { StepsSection } from "./_components/StepsSection";

export const metadata: Metadata = {
  title: "PickTrip | 하동·영주·예천 여행 콘텐츠와 AI 일정",
  description:
    "하동, 영주, 예천의 여행 콘텐츠를 둘러보고 AI가 만든 맞춤 여행 일정을 받아보세요.",
};

// 히어로의 콘텐츠 개수가 데이터 추가를 매 요청마다 즉시 반영하도록 홈을
// 정적 프리렌더 대상에서 제외한다(기본값이면 빌드 시점 값으로 굳어버린다).
export const dynamic = "force-dynamic";

// 히어로의 "여행 콘텐츠" 지표에 쓸 실제 총 개수. 콘텐츠가 늘어나도 코드
// 수정 없이 그대로 반영되도록 하드코딩 대신 매 요청마다 조회한다.
async function getTotalContentCount(): Promise<number | null> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { total } = await getContents({
      regions: [...REGIONS],
      startDate: today,
      nights: 0,
    });
    return total;
  } catch (err) {
    console.error("[home] 콘텐츠 총 개수 조회 실패:", err);
    return null;
  }
}

export default async function Home() {
  const contentCount = await getTotalContentCount();

  return (
    <main className="flex flex-1 flex-col">
      <HomeGate>
        <HeroSection contentCount={contentCount} />
        <RegionShowcase />
        <StepsSection />
        <CtaSection />
      </HomeGate>
    </main>
  );
}
