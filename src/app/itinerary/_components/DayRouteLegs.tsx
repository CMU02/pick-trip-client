import { formatDistanceKm, formatTravelMinutes } from "@/lib/itinerary";
import type { RoutePoint, RouteResult } from "@/types/map";

interface DayRouteLegsProps {
  points: RoutePoint[];
  route: RouteResult | null;
}

// 사이드바 지도 아래 구간 목록. "1→2  최참판댁 → 고하버거  9분 · 4.8km" 한 줄씩.
// 실도로 길찾기(route) 결과가 없으면 아무것도 그리지 않는다 — 직선 근사로
// 채우지 않는다.
export function DayRouteLegs({ points, route }: DayRouteLegsProps) {
  if (!route || route.segments.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {route.segments.map((seg, i) => {
        const from = points[i];
        const to = points[i + 1];
        if (!from || !to) return null;
        const parts = [
          formatTravelMinutes(Math.round(seg.durationSeconds / 60)),
          formatDistanceKm(seg.distanceMeters / 1000),
        ].filter(Boolean);
        return (
          <li
            key={`${from.contentId}-${to.contentId}`}
            className="flex items-center gap-2 text-[12px] text-muted-foreground"
          >
            <span className="shrink-0 font-bold tabular-nums text-foreground/70">
              {i + 1}→{i + 2}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {from.title} → {to.title}
            </span>
            {parts.length > 0 && (
              <span className="shrink-0 tabular-nums">{parts.join(" · ")}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
