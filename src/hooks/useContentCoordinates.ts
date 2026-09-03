"use client";

import { useQueries } from "@tanstack/react-query";

import { toLatLng } from "@/lib/geo";
import { getContentById } from "@/services/contentService";
import type { LatLng } from "@/types/map";

interface UseContentCoordinatesResult {
  // contentId → 좌표. 조회 실패·무효 좌표(0/0, 해외)는 null.
  coords: Map<string, LatLng | null>;
  isLoading: boolean;
  isError: boolean;
}

// 일정 항목의 contentId 목록을 좌표로 해석한다. 다건 조회 엔드포인트가 없어
// GET /api/v1/contents/{id} 를 항목마다 부르되(백엔드가 상세 응답을 캐시함),
// React Query 로 dedupe + 캐시한다. 상세 자체는 ["content-detail", id] 키로
// 재사용 가능하게 둔다.
export function useContentCoordinates(
  contentIds: string[],
): UseContentCoordinatesResult {
  const uniqueIds = [...new Set(contentIds)];

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["content-detail", id] as const,
      queryFn: () => getContentById(id),
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 1,
    })),
  });

  const coords = new Map<string, LatLng | null>();
  uniqueIds.forEach((id, i) => {
    const detail = queries[i]?.data;
    coords.set(id, detail ? toLatLng(detail.latitude, detail.longitude) : null);
  });

  return {
    coords,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.length > 0 && queries.every((q) => q.isError),
  };
}
