"use client";

import { useState } from "react";

import { ContentFilter } from "@/components/ContentFilter";
import { Button } from "@/components/ui/button";
import {
  type ContentQueryParams,
  useLoadMoreContents,
} from "@/hooks/useLoadMoreContents";
import { groupContentsByCategory } from "@/lib/content";
import type { Content, ContentCategory } from "@/types/content";
import type { Region } from "@/types/region";

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
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");

  const {
    contents: loadedContents,
    total,
    hasMore,
    isLoadingMore,
    errorMessage,
    loadMore,
  } = useLoadMoreContents({
    queryKey: ["contents", queryParams],
    queryParams,
    initialContents,
    initialTotal,
  });

  const filtered = loadedContents.filter((c) => {
    const matchRegion =
      selectedRegions.length === 0 || selectedRegions.includes(c.region);
    const matchCategory =
      selectedCategories.length === 0 ||
      (c.category !== undefined && selectedCategories.includes(c.category));
    const q = keyword.trim().toLowerCase();
    const matchKeyword =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    return matchRegion && matchCategory && matchKeyword;
  });

  if (loadedContents.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        콘텐츠가 없습니다
      </p>
    );
  }

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

      <ContentFilter
        selectedRegions={selectedRegions}
        selectedCategories={selectedCategories}
        keyword={keyword}
        onRegionChange={setSelectedRegions}
        onCategoryChange={setSelectedCategories}
        onKeywordChange={setKeyword}
      />
      <p className="text-sm text-muted-foreground">{filtered.length}개 결과</p>

      {filtered.length === 0 ? (
        <p className="flex min-h-[60vh] items-center justify-center text-center text-sm text-muted-foreground">
          조건에 맞는 콘텐츠가 없습니다
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groupContentsByCategory(filtered).map((group) => (
            <section key={group.key}>
              <h2 className="mb-3.5 flex items-center gap-2.5 text-[17px] font-extrabold tracking-tight text-foreground">
                <span className="h-[17px] w-1 rounded-full bg-primary" />
                {group.label}
                <span className="text-[13px] font-normal text-muted-foreground">
                  {group.items.length}개
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((content) => (
                  <ExploreCard key={content.id} content={content} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        {hasMore && (
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore
              ? "불러오는 중..."
              : `더보기 (${loadedContents.length}/${total})`}
          </Button>
        )}
      </div>
    </div>
  );
}
