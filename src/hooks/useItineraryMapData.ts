"use client";

import { useContentCoordinates } from "@/hooks/useContentCoordinates";
import { useItineraryRoutes } from "@/hooks/useItineraryRoute";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapData, RoutePoint } from "@/types/map";

// 일정 days → 지도 데이터. contentId 를 좌표로 해석해 일차별 마커 목록을 만들고,
// 일차마다 Kakao 길찾기로 실제 도로 경로를 붙인다. 길찾기가 없거나 실패하면
// route 는 null 이고 ItineraryMap 이 마커 + 직선 폴백만 그린다.
export function useItineraryMapData(days: Day[]): ItineraryMapData {
  const allContentIds = days.flatMap((d) => d.items.map((it) => it.contentId));
  const { coords, isLoading, isError } = useContentCoordinates(allContentIds);

  const daysPoints = days.map((d) => {
    const points: RoutePoint[] = [];
    for (const it of d.items) {
      const c = coords.get(it.contentId);
      if (c) points.push({ ...c, contentId: it.contentId, title: it.title });
    }
    return { dayIndex: d.dayIndex, points };
  });

  const routes = useItineraryRoutes(daysPoints);

  return {
    status: isLoading ? "loading" : isError ? "error" : "ready",
    days: daysPoints.map((d) => ({
      ...d,
      route: routes.get(d.dayIndex) ?? null,
    })),
  };
}
