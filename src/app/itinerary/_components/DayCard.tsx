import { Icon } from "@/components/ui/icon";
import {
  formatDayDate,
  formatDistanceKm,
  formatTravelMinutes,
} from "@/lib/itinerary";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapDay } from "@/types/map";
import { ItineraryMap } from "./ItineraryMap";
import { PlaceItem } from "./PlaceItem";

interface DayCardProps {
  day: Day;
  // 이 날의 지도 데이터(좌표·경로). 좌표가 있는 장소가 하나라도 있을 때만
  // 카드 안에 지도를 그린다.
  mapDay?: ItineraryMapDay;
  onMoveItem?: (
    dayId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
  onRemoveItem?: (dayId: string, itemId: string) => void;
  onTogglePinned?: (dayId: string, itemId: string) => void;
  onOpenReplacePicker?: (dayId: string, itemId: string) => void;
}

export function DayCard({
  day,
  mapDay,
  onMoveItem,
  onRemoveItem,
  onTogglePinned,
  onOpenReplacePicker,
}: DayCardProps) {
  // 백엔드는 dayIndex를 1부터 채번한다(OpenAiItineraryClient 시스템 프롬프트,
  // ItineraryServiceTest 등 서버 픽스처 전부 1부터 시작). 그대로 표시한다.
  const dayNumber = day.dayIndex;
  const dateLabel = formatDayDate(day.date);
  // 이동 요약: Kakao 길찾기(실제 도로) 결과가 있으면 우선, 없으면 백엔드
  // 스케줄러 값(직선 근사)으로 폴백한다.
  const route = mapDay?.route ?? null;
  const travelDuration = route
    ? formatTravelMinutes(Math.round(route.totalDurationSeconds / 60))
    : formatTravelMinutes(day.totalTravelMinutes);
  const travelDistance = route
    ? formatDistanceKm(route.totalDistanceMeters / 1000)
    : formatDistanceKm(day.totalTravelKm);
  const travelLabel = [travelDuration, travelDistance]
    .filter(Boolean)
    .join(" · ");
  const dayNotes = day.dayNotes ?? [];

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="border-b border-[oklch(0.95_0.008_30)] bg-[oklch(0.985_0.012_30)] px-5.5 py-4.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-primary text-sm font-extrabold text-primary-foreground">
              {dayNumber}
            </span>
            <h3 className="text-[18px] font-bold tracking-tight text-foreground">
              {dayNumber}일차
              {dateLabel && (
                <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">
                  {dateLabel}
                </span>
              )}
            </h3>
          </div>
          <span className="text-[12.5px] text-muted-foreground">
            {day.items.length}곳
          </span>
        </div>
        {travelLabel && (
          <p className="mt-1.5 flex items-center gap-1 pl-[46px] text-[12px] text-muted-foreground">
            <Icon name="compass-outline" size={13} className="shrink-0" />
            이동 {travelLabel}
            {route && (
              <span className="text-muted-foreground/70"> · 자동차</span>
            )}
          </p>
        )}
      </div>
      {dayNotes.length > 0 && (
        <ul className="space-y-1 border-b border-border bg-amber-50/60 px-5.5 py-3 text-xs text-amber-700">
          {dayNotes.map((note) => (
            <li key={note} className="flex items-start gap-1.5">
              <Icon
                name="alert"
                size={13}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
      {mapDay && mapDay.points.length > 0 && (
        <div className="border-b border-border px-5.5 py-4">
          <ItineraryMap variant="day" days={[mapDay]} />
        </div>
      )}
      {day.items.length === 0 ? (
        <p className="px-5.5 py-6 text-sm text-muted-foreground">
          이 날에는 아직 일정이 없어요
        </p>
      ) : (
        <div className="divide-y divide-border px-5.5">
          {day.items.map((item, index) => (
            <PlaceItem
              key={item.itemId}
              item={item}
              isFirst={index === 0}
              isLast={index === day.items.length - 1}
              onMoveUp={
                onMoveItem
                  ? () => onMoveItem(day.dayId, item.itemId, "up")
                  : undefined
              }
              onMoveDown={
                onMoveItem
                  ? () => onMoveItem(day.dayId, item.itemId, "down")
                  : undefined
              }
              onRemove={
                onRemoveItem
                  ? () => onRemoveItem(day.dayId, item.itemId)
                  : undefined
              }
              onTogglePinned={
                onTogglePinned
                  ? () => onTogglePinned(day.dayId, item.itemId)
                  : undefined
              }
              onOpenReplacePicker={
                onOpenReplacePicker
                  ? () => onOpenReplacePicker(day.dayId, item.itemId)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
