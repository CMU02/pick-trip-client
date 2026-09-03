import { Fragment } from "react";

import { Icon } from "@/components/ui/icon";
import {
  dayTravelLabel,
  formatDayDate,
  formatDistanceKm,
  formatTravelMinutes,
} from "@/lib/itinerary";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapDay } from "@/types/map";
import { PlaceItem } from "./PlaceItem";

interface DayCardProps {
  day: Day;
  // 이 날의 지도 데이터. 지도는 사이드바에서만 그리므로 여기서는 route(실도로
  // 구간값)만 쓴다 — 장소 사이 이동 구간 pill과 헤더 이동 합계.
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
  // 백엔드는 dayIndex를 1부터 채번한다.
  const dayNumber = day.dayIndex;
  const dateLabel = formatDayDate(day.date);
  const route = mapDay?.route ?? null;
  // route.segments 는 좌표가 해석된 지점(points) 사이 구간이다. 좌표가 빠진
  // 장소가 있으면 segments 인덱스가 items 인덱스와 어긋나므로, 전부 해석된
  // 경우에만 장소 사이 구간 pill을 그린다.
  const legsAligned =
    route !== null && (mapDay?.points.length ?? 0) === day.items.length;

  const departure = day.items[0]?.startTime ?? null;

  // 이동 합계: Kakao 길찾기(실도로) 결과 우선, 없으면 백엔드 스케줄러 값.
  const travelLabel = dayTravelLabel(day, mapDay);

  const dayNotes = day.dayNotes ?? [];

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="border-b border-[oklch(0.95_0.008_30)] bg-[oklch(0.985_0.012_30)] px-5.5 py-4.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-primary text-sm font-extrabold text-primary-foreground">
              {dayNumber}
            </span>
            <div>
              <h3 className="text-[18px] font-bold tracking-tight text-foreground">
                {dayNumber}일차
              </h3>
              {dateLabel && (
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {dateLabel}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-[22px] text-right">
            {departure && (
              <div>
                <p className="text-[11px] text-muted-foreground">출발</p>
                <p className="text-[15px] font-extrabold tabular-nums tracking-[-0.02em] text-foreground">
                  {departure}
                </p>
              </div>
            )}
            {travelLabel && (
              <div>
                <p className="text-[11px] text-muted-foreground">차량 이동</p>
                <p className="text-[15px] font-extrabold tabular-nums tracking-[-0.02em] text-foreground">
                  {travelLabel}
                </p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-muted-foreground">장소</p>
              <p className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">
                {day.items.length}곳
              </p>
            </div>
          </div>
        </div>

        {dayNotes.length > 0 && (
          <ul className="mt-3.5 flex flex-col gap-1.5">
            {dayNotes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-1.5 rounded-[11px] bg-[oklch(0.975_0.035_85)] px-3 py-2 text-[12.5px] leading-relaxed text-[oklch(0.45_0.09_70)]"
              >
                <Icon name="alert" size={13} className="mt-0.5 shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {day.items.length === 0 ? (
        <p className="px-5.5 py-6 text-sm text-muted-foreground">
          이 날에는 아직 일정이 없어요
        </p>
      ) : (
        <div className="grid grid-cols-[62px_26px_minmax(0,1fr)] gap-x-3.5 px-5.5 pt-4">
          {day.items.map((item, index) => {
            const segment = legsAligned
              ? (route?.segments[index] ?? null)
              : null;
            const showLeg = index < day.items.length - 1 && segment !== null;
            return (
              <Fragment key={item.itemId}>
                <PlaceItem
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
                {showLeg && segment && (
                  <>
                    <div />
                    <div className="relative flex justify-center">
                      <span className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border" />
                      <span className="relative z-10 mt-1 h-2 w-2 rounded-full bg-border" />
                    </div>
                    <div className="min-w-0 pb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[oklch(0.985_0.008_30)] px-3 py-1.5 text-[12px] font-bold text-[oklch(0.4_0.015_30)]">
                        <Icon
                          name="compass-outline"
                          size={13}
                          className="shrink-0"
                        />
                        차로{" "}
                        {[
                          formatTravelMinutes(
                            Math.round(segment.durationSeconds / 60),
                          ),
                          formatDistanceKm(segment.distanceMeters / 1000),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </>
                )}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
