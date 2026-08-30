import { Icon } from "@/components/ui/icon";
import { dayTravelLabel } from "@/lib/itinerary";
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
// 지도는 카드 상단 경계에 붙여(패딩 0) 왼쪽 DayCard 헤더와 시작선을 맞춘다.
export function DayMapPanel({
  days,
  mapData,
  selectedDayIndex,
}: DayMapPanelProps) {
  const day = days[selectedDayIndex];
  const mapDay = day
    ? mapData.days.find((d) => d.dayIndex === day.dayIndex)
    : undefined;

  if (!day || !mapDay || mapDay.points.length === 0) return null;

  const last = mapDay.points[mapDay.points.length - 1];
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    last.title,
  )},${last.lat},${last.lng}`;
  const travelLabel = dayTravelLabel(day, mapDay);

  return (
    <section className="overflow-hidden rounded-[20px] border border-border bg-card">
      <ItineraryMap
        variant="day"
        days={[mapDay]}
        heightClassName="h-[300px]"
        bare
      />

      <div className="flex flex-col gap-3 p-4">
        {travelLabel && (
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-muted-foreground">
              {day.dayIndex}일차 구간
            </span>
            <span className="font-extrabold text-foreground">
              {travelLabel}
            </span>
          </div>
        )}

        <DayRouteLegs points={mapDay.points} route={mapDay.route} />

        <a
          href={kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[12px] border border-border text-[13px] font-bold text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="external-link" size={14} />
          카카오맵에서 경로 열기
        </a>
      </div>
    </section>
  );
}
