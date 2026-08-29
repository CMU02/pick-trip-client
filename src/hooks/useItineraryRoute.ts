"use client";

import { useQueries } from "@tanstack/react-query";

import { getDirections } from "@/services/directionsService";
import type { RoutePoint, RouteResult } from "@/types/map";

interface DayPoints {
  dayIndex: number;
  points: RoutePoint[];
}

function roundKey(points: RoutePoint[]): [number, number][] {
  return points.map((p) => [
    Math.round(p.lat * 1e5) / 1e5,
    Math.round(p.lng * 1e5) / 1e5,
  ]);
}

// 일차별로 Kakao 길찾기를 조회한다. 키에 dayIndex를 넣어(좌표만으로는 장소가
// 없는 여러 날이 같은 키 []가 되어 useQueries가 중복 경고를 낸다) 날마다 별도
// 캐시하고, 저장/편집으로 순서가 바뀌면 roundKey가 달라져 새로 조회한다.
export function useItineraryRoutes(
  daysPoints: DayPoints[],
): Map<number, RouteResult | null> {
  const results = useQueries({
    queries: daysPoints.map((d) => ({
      queryKey: ["directions", d.dayIndex, roundKey(d.points)] as const,
      queryFn: () => getDirections(d.points),
      enabled: d.points.length >= 2,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 1000 * 60 * 60,
      retry: 0,
    })),
  });

  const byDay = new Map<number, RouteResult | null>();
  daysPoints.forEach((d, i) => {
    byDay.set(d.dayIndex, results[i]?.data ?? null);
  });
  return byDay;
}
