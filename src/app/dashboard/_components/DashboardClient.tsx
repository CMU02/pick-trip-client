"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { Content } from "@/types/content";

import { DashboardHero } from "./DashboardHero";
import { ForYouSection } from "./ForYouSection";
import { MyTripsSection } from "./MyTripsSection";
import { RecentSection } from "./RecentSection";

interface DashboardClientProps {
  recommendedPool: Content[];
}

// 비로그인 직접 접근 가드. HomeGate와 대칭되는 반대 방향 리다이렉트다.
export function DashboardClient({ recommendedPool }: DashboardClientProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading") return null;

  return (
    <div className="flex flex-col gap-16">
      <DashboardHero />
      <MyTripsSection />
      <ForYouSection recommendedPool={recommendedPool} />
      <RecentSection />
    </div>
  );
}
