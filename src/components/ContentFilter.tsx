"use client";

import { Icon } from "@/components/ui/icon";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type ContentCategory,
} from "@/types/content";
import { REGION_LABELS, REGIONS, type Region } from "@/types/region";

interface ContentFilterProps {
  selectedRegions: Region[];
  selectedCategories: ContentCategory[];
  keyword: string;
  onRegionChange: (regions: Region[]) => void;
  onCategoryChange: (categories: ContentCategory[]) => void;
  onKeywordChange: (keyword: string) => void;
}

export function ContentFilter({
  selectedRegions,
  selectedCategories,
  keyword,
  onRegionChange,
  onCategoryChange,
  onKeywordChange,
}: ContentFilterProps) {
  function toggleRegion(region: Region) {
    if (selectedRegions.includes(region)) {
      onRegionChange(selectedRegions.filter((r) => r !== region));
    } else {
      onRegionChange([...selectedRegions, region]);
    }
  }

  function toggleCategory(category: ContentCategory) {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => {
          const selected = selectedRegions.includes(region);
          return (
            <button
              key={region}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleRegion(region)}
              className={
                selected
                  ? "rounded-full border border-primary bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40"
              }
            >
              {REGION_LABELS[region]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_CATEGORIES.map((category) => {
          const selected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleCategory(category)}
              className={
                selected
                  ? "flex items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                  : "flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40"
              }
            >
              <Icon name={CATEGORY_ICONS[category]} size={14} />
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

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
