"use client";

import { useContentCoordinates } from "@/hooks/useContentCoordinates";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapData, RoutePoint } from "@/types/map";

// 일정 days → 지도 데이터. contentId 를 좌표로 해석해 일차별 마커 목록을 만든다.
// 실제 도로 경로(route)는 P3(useItineraryRoute)에서 붙는다 — 지금은 항상 null
// 이라 ItineraryMap 이 마커 + 직선 폴백만 그린다.
export function useItineraryMapData(days: Day[]): ItineraryMapData {
  const allContentIds = days.flatMap((d) => d.items.map((it) => it.contentId));
  const { coords, isLoading, isError } = useContentCoordinates(allContentIds);

  const mapDays = days.map((d) => {
    const points: RoutePoint[] = [];
    for (const it of d.items) {
      const c = coords.get(it.contentId);
      if (c) points.push({ ...c, contentId: it.contentId, title: it.title });
    }
    return { dayIndex: d.dayIndex, points, route: null };
  });

  return {
    status: isLoading ? "loading" : isError ? "error" : "ready",
    days: mapDays,
  };
}
