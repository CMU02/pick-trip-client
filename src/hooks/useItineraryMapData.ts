"use client";

import { useMemo } from "react";

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

  const resolvedDays = daysPoints.map((d) => ({
    ...d,
    route: routes.get(d.dayIndex) ?? null,
  }));

  // coords/routes는 매 렌더 새 Map을 반환해(useContentCoordinates,
  // useItineraryRoutes 어느 쪽도 메모이즈하지 않는다) resolvedDays도 참조가
  // 매번 달라진다. 이 훅을 호출하는 화면이 지도 내용과 무관한 이유로
  // 리렌더되면(예: SavedItineraryDetail의 지도 확대/축소 토글) 그때마다
  // 새 배열이 나가, DayMapPanel의 useMemo([mapDay])가 매번 miss하고
  // ItineraryMap의 [days, variant, status] 이펙트가 마커·폴리라인을 전부
  // 다시 만드는 낭비로 이어졌다. 실제 좌표·경로 내용을 직렬화한 시그니처가
  // 같으면 이전에 반환했던 배열을 그대로 돌려줘 참조를 안정시킨다.
  const signature = JSON.stringify(resolvedDays);
  // biome-ignore lint/correctness/useExhaustiveDependencies: resolvedDays는 매 렌더 새로 만들어져 의도적으로 뺀다 — signature가 같으면 이전 렌더의 값을 그대로 재사용해야 한다.
  const stableDays = useMemo(() => resolvedDays, [signature]);

  return {
    status: isLoading ? "loading" : isError ? "error" : "ready",
    days: stableDays,
  };
}
