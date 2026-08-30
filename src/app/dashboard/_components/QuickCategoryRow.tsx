"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CONTENT_CATEGORY_ORDER,
  type ContentCategory,
} from "@/types/content";

export type QuickCategory = ContentCategory | "ALL";

interface QuickCategoryRowProps {
  selected: QuickCategory;
  onSelect: (category: QuickCategory) => void;
}

// 퀵 카테고리 6열(음식/관광지/문화/자연/체험 + 전체). 타일을 클릭하면 아래
// "FOR YOU 추천" 섹션이 해당 카테고리로 필터링된다.
//
// 개수는 대시보드가 받아오는 작은 추천 풀(지역당 20개)이 아니라, 홈
// 히어로(CONTENT_COUNT)와 같은 기준인 전체 카탈로그 실제 개수다. 매
// 요청마다 전체를 세면 API 호출량이 커서 정적 값으로 굳혀 둔다.
//
// 전체(ALL) = 백엔드 /api/v1/contents 지역별 totalCount 합. TourAPI 카탈로그
// 변동으로 흔들린다: 2026-08-27 222 → 08-29 221 → 08-30 413(하동 190 + 영주
// 145 + 예천 78). 카테고리별 값은 2026-08-30 기준 아이템 category 필드 집계
// (음식 112 + 관광지 68 + 문화 117 + 자연 50 + 체험 57 + 축제 9 = 413). 축제
// (FESTIVAL 9)는 타일에서 빠지므로, 보이는 5칸 합(404)은 전체(413)보다 축제
// 9만큼 적다.
const CATEGORY_COUNTS: Record<ContentCategory, number> = {
  FOOD: 112,
  FESTIVAL: 9,
  ATTRACTION: 68,
  CULTURE: 117,
  NATURE: 50,
  EXPERIENCE: 57,
};

// 타일 순서는 앱 공통 CONTENT_CATEGORY_ORDER를 따른다. 축제(개수 9)는
// 타일에서 제외하고, "전체"는 항상 맨 뒤에 둔다.
// 아이콘은 CATEGORY_ICONS와 마찬가지로 pick-trip-app(Ionicons)에 맞춘다.
const QUICK_DEFS: { key: QuickCategory; icon: IconName; count: number }[] = [
  ...CONTENT_CATEGORY_ORDER.filter((category) => category !== "FESTIVAL").map(
    (category) => ({
      key: category as QuickCategory,
      icon: CATEGORY_ICONS[category],
      count: CATEGORY_COUNTS[category],
    }),
  ),
  { key: "ALL", icon: "map-outline", count: 413 },
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
