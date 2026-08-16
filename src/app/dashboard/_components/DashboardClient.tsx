"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { Content } from "@/types/content";

import { DashboardHero } from "./DashboardHero";
import { ForYouSection } from "./ForYouSection";
import { MyTripsSection } from "./MyTripsSection";
import { type QuickCategory, QuickCategoryRow } from "./QuickCategoryRow";
import { RecentSection } from "./RecentSection";

interface DashboardClientProps {
  recommendedPool: Content[];
}

// 비로그인 직접 접근 가드. HomeGate와 대칭되는 반대 방향 리다이렉트다.
export function DashboardClient({ recommendedPool }: DashboardClientProps) {
  const { status } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState<QuickCategory>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading") return null;

  return (
    <div className="flex flex-col gap-12">
      <DashboardHero />
      <QuickCategoryRow
        contents={recommendedPool}
        selected={category}
        onSelect={setCategory}
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_330px]">
        <MyTripsSection />
        <RecentSection />
      </div>
      <ForYouSection recommendedPool={recommendedPool} category={category} />
    </div>
  );
}
