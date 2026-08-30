"use client";

import { formatDistanceKm } from "@/lib/itinerary";
import { cn } from "@/lib/utils";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapDay } from "@/types/map";

interface DayTabsProps {
  days: Day[];
  // 일차별 지도 데이터. 탭 라벨의 거리(실도로 우선)를 뽑는 데만 쓴다.
  mapDaysByIndex: Map<number, ItineraryMapDay>;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

// 탭 하나의 보조 라벨: "4곳 · 38.5km". 실도로 route 거리가 있으면 그걸,
// 없으면 백엔드 스케줄러 값, 둘 다 없으면 곳 수만.
function subLabel(day: Day, mapDay?: ItineraryMapDay): string {
  const km = mapDay?.route
    ? formatDistanceKm(mapDay.route.totalDistanceMeters / 1000)
    : formatDistanceKm(day.totalTravelKm);
  return [`${day.items.length}곳`, km].filter(Boolean).join(" · ");
}

// "생성된 일정" 제목 자리를 대신하는 일차 탭. 하루짜리 일정은 탭이 의미
// 없으므로 렌더하지 않는다(호출부가 정렬용 스페이서를 대신 둔다).
export function DayTabs({
  days,
  mapDaysByIndex,
  selectedIndex,
  onSelect,
}: DayTabsProps) {
  if (days.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="일차 선택"
      className="flex w-fit gap-2 rounded-[14px] bg-muted p-[5px]"
    >
      {days.map((day, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={day.dayId}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(index)}
            className={cn(
              "rounded-[10px] px-[18px] py-[9px] text-[13.5px] font-bold transition-colors",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {day.dayIndex}일차
            <span
              className={cn(
                "ml-1.5 text-[11.5px] font-medium",
                selected ? "text-muted-foreground" : "text-muted-foreground/70",
              )}
            >
              {subLabel(day, mapDaysByIndex.get(day.dayIndex))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
