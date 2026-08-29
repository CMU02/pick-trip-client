"use client";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { type ParsedApiError, parseApiError } from "@/lib/errors";
import { hasEmptyDay, toSaveDays } from "@/lib/itinerary";
import { modifyItinerary } from "@/services/itineraryService";
import type { Content } from "@/types/content";
import type { Day, SaveItineraryRequest } from "@/types/itinerary";
import type { Region } from "@/types/region";

interface UseItineraryEditorOptions {
  itineraryId: string;
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  initialDays: Day[];
}

function moveWithinDay(
  items: Day["items"],
  itemId: string,
  direction: "up" | "down",
) {
  const index = items.findIndex((item) => item.itemId === itemId);
  if (index === -1) return items;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next.map((item, i) => ({ ...item, order: i }));
}

// 서버는 저장(PATCH) 시 스케줄러를 다시 돌리지 않는다. 사용자가 순서를 바꾸거나
// 장소를 빼면 서버가 계산해준 방문 시각·이동 요약이 어긋나므로, 편집한 날의
// 그 값들을 지워 화면에서 잘못된 시각이 보이지 않게 한다. 재계산은 "다시 생성" 몫.
function clearDaySchedule(day: Day): Day {
  return {
    ...day,
    totalTravelMinutes: null,
    totalTravelKm: null,
    items: day.items.map((item) => ({
      ...item,
      startTime: null,
      endTime: null,
    })),
  };
}

export function useItineraryEditor({
  itineraryId,
  title,
  region,
  travelDate,
  duration,
  initialDays,
}: UseItineraryEditorOptions) {
  const { runAuthed } = useAuth();
  const [days, setDays] = useState<Day[]>(initialDays);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ParsedApiError | null>(null);

  function moveItem(dayId: string, itemId: string, direction: "up" | "down") {
    setDays((prev) =>
      prev.map((day) =>
        day.dayId === dayId
          ? clearDaySchedule({
              ...day,
              items: moveWithinDay(day.items, itemId, direction),
            })
          : day,
      ),
    );
    setIsDirty(true);
  }

  function removeItem(dayId: string, itemId: string) {
    setDays((prev) =>
      prev.map((day) =>
        day.dayId === dayId
          ? clearDaySchedule({
              ...day,
              items: day.items
                .filter((item) => item.itemId !== itemId)
                .map((item, i) => ({ ...item, order: i })),
            })
          : day,
      ),
    );
    setIsDirty(true);
  }

  function togglePinned(dayId: string, itemId: string) {
    setDays((prev) =>
      prev.map((day) =>
        day.dayId === dayId
          ? {
              ...day,
              items: day.items.map((item) =>
                item.itemId === itemId
                  ? { ...item, pinned: !item.pinned }
                  : item,
              ),
            }
          : day,
      ),
    );
    setIsDirty(true);
  }

  function replaceItem(dayId: string, itemId: string, replacement: Content) {
    setDays((prev) =>
      prev.map((day) =>
        day.dayId === dayId
          ? clearDaySchedule({
              ...day,
              items: day.items.map((item) =>
                item.itemId === itemId
                  ? {
                      ...item,
                      contentId: replacement.id,
                      title: replacement.name,
                      reason: "",
                    }
                  : item,
              ),
            })
          : day,
      ),
    );
    setIsDirty(true);
  }

  async function save() {
    // 장소가 없는 날이 있으면 백엔드가 저장을 거부한다(저장 버튼도 이미 막혀 있음).
    if (hasEmptyDay(days)) {
      setSaveError({
        message: "장소가 없는 날이 있어 저장할 수 없어요.",
      });
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const request: SaveItineraryRequest = {
        title,
        region,
        travelDate,
        duration,
        days: toSaveDays(days),
      };
      const saved = await runAuthed((token) =>
        modifyItinerary(itineraryId, request, token),
      );
      setDays(saved.days);
      setIsDirty(false);
    } catch (err) {
      setSaveError(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return {
    days,
    isDirty,
    isSaving,
    saveError,
    moveItem,
    removeItem,
    togglePinned,
    replaceItem,
    save,
  };
}
