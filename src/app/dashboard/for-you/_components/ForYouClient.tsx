"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BasketLayout } from "@/components/BasketLayout";
import { useAuth } from "@/hooks/useAuth";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import type { Content } from "@/types/content";
import { ALL_REGIONS_QUERY } from "@/types/region";

import { ForYouGrid } from "./ForYouGrid";

interface ForYouClientProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
}

// 비로그인 직접 접근 가드. DashboardClient와 동일한 리다이렉트 패턴이다.
export function ForYouClient({
  initialContents,
  initialTotal,
  queryParams,
}: ForYouClientProps) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading") return null;

  return (
    <BasketLayout
      generateHref={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            For You
          </p>
          <h2 className="text-lg font-bold text-foreground">
            {user?.nickname}님을 위한 추천 더보기
          </h2>
        </div>
        <ForYouGrid
          initialContents={initialContents}
          initialTotal={initialTotal}
          queryParams={queryParams}
        />
      </div>
    </BasketLayout>
  );
}
