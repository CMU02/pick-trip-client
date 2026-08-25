"use client";

import { ContentBrowser } from "@/components/ContentBrowser";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import type { Content } from "@/types/content";

import { ExploreCard } from "./ExploreCard";

interface ExploreGridProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
}

export function ExploreGrid({
  initialContents,
  initialTotal,
  queryParams,
}: ExploreGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[24px] bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] p-10 text-white">
        <p className="text-[11.5px] font-extrabold tracking-widest opacity-85 uppercase">
          Explore
        </p>
        <h1 className="mt-3 text-[34px] font-extrabold tracking-tight">
          경상도 소도시 콘텐츠 둘러보기
        </h1>
        <p className="mt-2.5 text-[15px] text-white/85">
          조건 없이 자유롭게 둘러보고, 마음에 들면 바로 담아두세요
        </p>
      </div>

      <ContentBrowser
        initialContents={initialContents}
        initialTotal={initialTotal}
        queryParams={queryParams}
        renderCard={(content) => (
          <ExploreCard key={content.id} content={content} />
        )}
        gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
}
