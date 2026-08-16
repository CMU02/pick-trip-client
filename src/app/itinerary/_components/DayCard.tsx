import type { Day } from "@/types/itinerary";
import { PlaceItem } from "./PlaceItem";

interface DayCardProps {
  day: Day;
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
  onMoveItem,
  onRemoveItem,
  onTogglePinned,
  onOpenReplacePicker,
}: DayCardProps) {
  // 백엔드는 dayIndex를 1부터 채번한다(OpenAiItineraryClient 시스템 프롬프트,
  // ItineraryServiceTest 등 서버 픽스처 전부 1부터 시작). 그대로 표시한다.
  const dayNumber = day.dayIndex;

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-[oklch(0.95_0.008_30)] bg-[oklch(0.985_0.012_30)] px-5.5 py-4.5">
        <div className="flex items-center gap-3">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-primary text-sm font-extrabold text-primary-foreground">
            {dayNumber}
          </span>
          <h3 className="text-[18px] font-bold tracking-tight text-foreground">
            {dayNumber}일차
          </h3>
        </div>
        <span className="text-[12.5px] text-muted-foreground">
          {day.items.length}곳
        </span>
      </div>
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
    </div>
  );
}
