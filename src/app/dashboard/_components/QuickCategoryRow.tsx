"use client";

import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  type Content,
  type ContentCategory,
} from "@/types/content";

export type QuickCategory = ContentCategory | "ALL";

interface QuickCategoryRowProps {
  contents: Content[];
  selected: QuickCategory;
  onSelect: (category: QuickCategory) => void;
}

// 핸드오프 스펙의 퀵 카테고리 5열. 문화/음식/자연/체험 + 전체를 클릭하면
// 아래 "FOR YOU 추천" 섹션이 해당 카테고리로 필터링된다.
const QUICK_DEFS: { key: QuickCategory; icon: string }[] = [
  { key: "CULTURE", icon: "⛩" },
  { key: "FOOD", icon: "🍽" },
  { key: "NATURE", icon: "🌿" },
  { key: "EXPERIENCE", icon: "🎋" },
  { key: "ALL", icon: "📍" },
];

export function QuickCategoryRow({
  contents,
  selected,
  onSelect,
}: QuickCategoryRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {QUICK_DEFS.map(({ key, icon }) => {
        const label = key === "ALL" ? "전체" : CATEGORY_LABELS[key];
        const count =
          key === "ALL"
            ? contents.length
            : contents.filter((c) => c.category === key).length;
        const on = selected === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(key)}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-left transition-colors",
              on
                ? "border-[oklch(0.82_0.1_30)] bg-[oklch(0.96_0.04_30)]"
                : "border-border bg-white hover:border-[oklch(0.8_0.09_30)]",
            )}
          >
            <span
              className={cn(
                "flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[11px] text-[15px]",
                on ? "bg-[oklch(0.92_0.07_30)]" : "bg-muted",
              )}
            >
              {icon}
            </span>
            <span>
              <span
                className={cn(
                  "block text-[13.5px] font-bold",
                  on ? "text-accent-foreground" : "text-foreground",
                )}
              >
                {label}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                {count}곳
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
