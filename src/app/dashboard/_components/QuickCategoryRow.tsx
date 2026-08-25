"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type ContentCategory } from "@/types/content";

export type QuickCategory = ContentCategory | "ALL";

interface QuickCategoryRowProps {
  selected: QuickCategory;
  onSelect: (category: QuickCategory) => void;
}

// 핸드오프 스펙의 퀵 카테고리 6열. 문화/음식/관광지/자연/체험 + 전체를
// 클릭하면 아래 "FOR YOU 추천" 섹션이 해당 카테고리로 필터링된다.
//
// 개수는 매번 recommendedPool(대시보드가 받아오는 추천 풀)을 세어
// 보여주던 걸 정적 값으로 바꿨다. 2026-08-25 기준 그 추천 풀(지역 3개 ×
// 20개 = 60개) 안의 실제 카테고리별 개수를 그대로 굳혀 둔다. 추천 풀
// 구성이 크게 달라지면 이 숫자만 수동으로 갱신한다.
const QUICK_DEFS: { key: QuickCategory; icon: string; count: number }[] = [
  { key: "CULTURE", icon: "⛩", count: 25 },
  { key: "FOOD", icon: "🍽", count: 13 },
  { key: "ATTRACTION", icon: "🏯", count: 9 },
  { key: "NATURE", icon: "🌿", count: 9 },
  { key: "EXPERIENCE", icon: "🎋", count: 4 },
  { key: "ALL", icon: "📍", count: 60 },
];

export function QuickCategoryRow({
  selected,
  onSelect,
}: QuickCategoryRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {QUICK_DEFS.map(({ key, icon, count }) => {
        const label = key === "ALL" ? "전체" : CATEGORY_LABELS[key];
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
