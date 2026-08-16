import type { Metadata } from "next";

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

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HomeGate>
        <HeroSection />
        <RegionShowcase />
        <StepsSection />
        <CtaSection />
      </HomeGate>
    </main>
  );
}
