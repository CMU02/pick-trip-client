import { Icon } from "@/components/ui/icon";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapData } from "@/types/map";
import { DayRouteLegs } from "./DayRouteLegs";
import { ItineraryMap } from "./ItineraryMap";

interface DayMapPanelProps {
  days: Day[];
  mapData: ItineraryMapData;
  selectedDayIndex: number;
}

// 선택한 일차 하나만 보여주는 고정 지도 + 구간 목록 + 카카오맵 링크.
// 레이아웃 사이드바(sticky)와 단독 렌더(공유 페이지·저장 목록 펼침) 양쪽에서 쓴다.
// 좌표가 있는 장소가 하나도 없으면 아무것도 그리지 않는다.
export function DayMapPanel({
  days,
  mapData,
  selectedDayIndex,
}: DayMapPanelProps) {
  const day = days[selectedDayIndex];
  const mapDay = day
    ? mapData.days.find((d) => d.dayIndex === day.dayIndex)
    : undefined;

  if (!mapDay || mapDay.points.length === 0) return null;

  const last = mapDay.points[mapDay.points.length - 1];
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    last.title,
  )},${last.lat},${last.lng}`;

  return (
    <section className="rounded-[20px] border border-border bg-card p-3.5">
      <div className="overflow-hidden rounded-[14px]">
        <ItineraryMap
          variant="day"
          days={[mapDay]}
          heightClassName="h-[300px]"
        />
      </div>

      <DayRouteLegs points={mapDay.points} route={mapDay.route} />

      <a
        href={kakaoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] border border-border py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <Icon name="external-link" size={14} />
        카카오맵에서 경로 열기
      </a>
    </section>
  );
}
