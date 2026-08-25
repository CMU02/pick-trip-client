"use client";

import { useState } from "react";

import { ContentFilter } from "@/components/ContentFilter";
import { groupContentsByCategory } from "@/lib/content";
import type { Content, ContentCategory } from "@/types/content";
import { REGIONS, type Region } from "@/types/region";

import { ForYouCard } from "./ForYouCard";

interface ForYouGridProps {
  initialContents: Content[];
}

// ExploreGrid와 동일한 필터/그룹/그리드 구조에 카드만 ForYouCard(찜+담기 액션)로 교체.
// 이 화면은 페이지네이션이 없어 ContentBrowser는 쓰지 않고 ContentFilter만
// 재사용한다 — 지역은 여기서도 서버 요청이 아닌 순수 클라이언트 필터다.
export function ForYouGrid({ initialContents }: ForYouGridProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL");
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");

  const filtered = initialContents.filter((c) => {
    const matchRegion = selectedRegion === "ALL" || c.region === selectedRegion;
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
      <ContentFilter
        regions={[...REGIONS]}
        selectedRegion={selectedRegion}
        selectedCategories={selectedCategories}
        keyword={keyword}
        onRegionChange={setSelectedRegion}
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
                    <ForYouCard key={content.id} content={content} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
