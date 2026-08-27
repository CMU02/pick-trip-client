"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type ContentCategory,
} from "@/types/content";

export type QuickCategory = ContentCategory | "ALL";

interface QuickCategoryRowProps {
  selected: QuickCategory;
  onSelect: (category: QuickCategory) => void;
}

// 핸드오프 스펙의 퀵 카테고리 6열. 문화/음식/관광지/자연/체험 + 전체를
// 클릭하면 아래 "FOR YOU 추천" 섹션이 해당 카테고리로 필터링된다.
//
// 개수는 대시보드가 받아오는 작은 추천 풀(지역당 20개)이 아니라, 홈
// 히어로(CONTENT_COUNT)와 같은 기준인 전체 카탈로그 실제 개수다. 매
// 요청마다 전체를 세면 API 호출량이 커서 정적 값으로 굳혀 둔다.
//
// 전체(ALL) = 백엔드 areaBasedList totalCount 합. TourAPI 카탈로그 변동으로
// 흔들린다: 2026-08-25 226 → 08-27 222(하동 103 + 영주 68 + 예천 51).
// 카테고리별 값은 2026-08-25 수동 분류 스냅샷(문화 77 + 음식 53 + 관광지 27
// + 자연 33 + 체험 33 = 223, + 무분류 축제 3)이라 지금은 전체와 정확히
// 합이 맞지 않는다. 재분류가 필요하면 카테고리별로 다시 센다. 축제(FESTIVAL)
// 타일은 핸드오프 스펙의 6칸(문화/음식/관광지/자연/체험/전체)에 없어 뺐다.
// 아이콘은 CATEGORY_ICONS와 마찬가지로 pick-trip-app(Ionicons)에 맞춘다.
const QUICK_DEFS: { key: QuickCategory; icon: IconName; count: number }[] = [
  { key: "CULTURE", icon: CATEGORY_ICONS.CULTURE, count: 77 },
  { key: "FOOD", icon: CATEGORY_ICONS.FOOD, count: 53 },
  { key: "ATTRACTION", icon: CATEGORY_ICONS.ATTRACTION, count: 27 },
  { key: "NATURE", icon: CATEGORY_ICONS.NATURE, count: 33 },
  { key: "EXPERIENCE", icon: CATEGORY_ICONS.EXPERIENCE, count: 33 },
  { key: "ALL", icon: "map-outline", count: 222 },
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
                "flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[11px]",
                on ? "bg-[oklch(0.92_0.07_30)]" : "bg-muted",
              )}
            >
              <Icon
                name={icon}
                size={17}
                className={on ? "text-accent-foreground" : "text-foreground"}
              />
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
