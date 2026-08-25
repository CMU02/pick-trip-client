"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type ContentCategory,
} from "@/types/content";
import { REGION_LABELS, type Region } from "@/types/region";

interface ContentFilterProps {
  // 탭으로 보여줄 허용된 지역 집합. 항상 전체 REGIONS는 아니다 — 예를
  // 들어 /contents는 사용자가 여행 조건에서 고른 지역만 넘긴다.
  regions: Region[];
  selectedRegion: Region | "ALL";
  selectedCategories: ContentCategory[];
  keyword: string;
  onRegionChange: (region: Region | "ALL") => void;
  onCategoryChange: (categories: ContentCategory[]) => void;
  onKeywordChange: (keyword: string) => void;
}

export function ContentFilter({
  regions,
  selectedRegion,
  selectedCategories,
  keyword,
  onRegionChange,
  onCategoryChange,
  onKeywordChange,
}: ContentFilterProps) {
  function toggleCategory(category: ContentCategory) {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="지역"
        className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <RegionTab
          label="전체"
          selected={selectedRegion === "ALL"}
          onClick={() => onRegionChange("ALL")}
        />
        {regions.map((region) => (
          <RegionTab
            key={region}
            label={REGION_LABELS[region]}
            selected={selectedRegion === region}
            onClick={() => onRegionChange(region)}
          />
        ))}
      </div>

      <CategoryChipRow
        selectedCategories={selectedCategories}
        onToggle={toggleCategory}
      />

      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Icon
          name="search"
          size={16}
          className="shrink-0 text-muted-foreground"
        />
        <input
          type="search"
          placeholder="장소 이름이나 주소로 검색"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="h-full flex-1 border-0 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function RegionTab({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={
        selected
          ? "relative px-3.5 pt-2 pb-2.5 text-[15px] font-bold whitespace-nowrap text-primary after:absolute after:right-2 after:bottom-0 after:left-2 after:h-[2.5px] after:rounded-full after:bg-primary after:content-['']"
          : "px-3.5 pt-2 pb-2.5 text-[15px] font-bold whitespace-nowrap text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}

function CategoryChipRow({
  selectedCategories,
  onToggle,
}: {
  selectedCategories: ContentCategory[];
  onToggle: (category: ContentCategory) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  function scrollByAmount(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          aria-label="이전 카테고리"
          onClick={() => scrollByAmount(-220)}
          className="absolute top-1/2 left-0 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <Icon name="chevron-left" size={14} />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CONTENT_CATEGORIES.map((category) => {
          const selected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(category)}
              className={
                selected
                  ? "flex shrink-0 items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-accent-foreground"
                  : "flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm whitespace-nowrap hover:border-primary/40"
              }
            >
              <Icon name={CATEGORY_ICONS[category]} size={14} />
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          type="button"
          aria-label="다음 카테고리"
          onClick={() => scrollByAmount(220)}
          className="absolute top-1/2 right-0 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <Icon name="chevron-right" size={14} />
        </button>
      )}
    </div>
  );
}
