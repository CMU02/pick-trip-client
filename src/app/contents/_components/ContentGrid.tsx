"use client";

import { useState } from "react";

import { BasketLayout } from "@/components/BasketLayout";
import { ContentFilter } from "@/components/ContentFilter";
import { groupContentsByCategory } from "@/lib/content";
import type { Content, ContentCategory } from "@/types/content";
import type { Region } from "@/types/region";

import { ContentCard } from "./ContentCard";

interface ContentGridProps {
  initialContents: Content[];
  itineraryHref: string;
  conditionLine: string;
}

export function ContentGrid({
  initialContents,
  itineraryHref,
  conditionLine,
}: ContentGridProps) {
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");

  const filtered = initialContents.filter((c) => {
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

  if (initialContents.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        콘텐츠가 없습니다
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-primary/70 uppercase">
            Step 2 · 콘텐츠 담기
          </p>
          <h1 className="mt-2.5 text-[32px] font-extrabold tracking-tight text-foreground">
            마음에 드는 콘텐츠를 담아보세요
          </h1>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            {conditionLine}
          </p>
        </div>
        <p className="text-[13.5px] whitespace-nowrap text-muted-foreground">
          {filtered.length}개 결과
        </p>
      </div>

      <BasketLayout generateHref={itineraryHref}>
        <div className="flex flex-col gap-6">
          <ContentFilter
            selectedRegions={selectedRegions}
            selectedCategories={selectedCategories}
            keyword={keyword}
            onRegionChange={setSelectedRegions}
            onCategoryChange={setSelectedCategories}
            onKeywordChange={setKeyword}
          />

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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((content) => (
                      <ContentCard key={content.id} content={content} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </BasketLayout>
    </div>
  );
}
