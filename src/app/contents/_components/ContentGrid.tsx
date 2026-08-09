"use client";

import { useState } from "react";

import { BasketLayout } from "@/components/BasketLayout";
import { ContentFilter } from "@/components/ContentFilter";
import { useBasket } from "@/hooks/useBasket";
import { groupContentsByCategory } from "@/lib/content";
import type { Content, ContentCategory } from "@/types/content";
import type { Region } from "@/types/region";

import { ContentCard } from "./ContentCard";

interface ContentGridProps {
  initialContents: Content[];
  itineraryHref: string;
}

export function ContentGrid({
  initialContents,
  itineraryHref,
}: ContentGridProps) {
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");
  const { items, add, remove } = useBasket();
  const basketIds = new Set(items.map((i) => i.content.id));

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
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length}개 결과
            </p>
            <div className="flex flex-col gap-8">
              {groupContentsByCategory(filtered).map((group) => (
                <section key={group.key}>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                    {group.label}
                    <span className="text-sm font-normal text-muted-foreground">
                      {group.items.length}개
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {group.items.map((content) => (
                      <ContentCard
                        key={content.id}
                        content={content}
                        isInBasket={basketIds.has(content.id)}
                        onToggleBasket={() =>
                          basketIds.has(content.id)
                            ? remove(content.id)
                            : add(content)
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </BasketLayout>
  );
}
