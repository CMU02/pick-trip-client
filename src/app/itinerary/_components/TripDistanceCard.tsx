import { formatDistanceKm } from "@/lib/itinerary";
import type { ItineraryMapDay } from "@/types/map";

interface TripDistanceCardProps {
  // useItineraryMapData 로 해석한 일차별 지도 데이터. route 는 Kakao 길찾기
  // 실도로 결과이고, 없는 날은 null 이라 합산에서 빠진다.
  mapDays: ItineraryMapDay[];
}

// 일정 결과 사이드바의 "이동 거리 합계" 박스(디자인 핸드오프 §9). 차량 길찾기
// 실도로 거리만 다루므로, 실제 경로가 잡힌 날이 하나도 없으면 렌더하지 않는다.
export function TripDistanceCard({ mapDays }: TripDistanceCardProps) {
  const daysWithRoute = mapDays.filter((d) => d.route);
  if (daysWithRoute.length === 0) return null;

  const totalKm = daysWithRoute.reduce(
    (sum, d) => sum + (d.route?.totalDistanceMeters ?? 0) / 1000,
    0,
  );
  const avgKm = totalKm / mapDays.length;

  const total = formatDistanceKm(totalKm);
  if (!total) return null;

  return (
    <section className="rounded-[20px] bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] p-5 text-white">
      <p className="text-sm font-bold">이동 거리 합계</p>
      <p className="mt-2 font-heading text-[30px] font-extrabold tracking-[-0.03em]">
        {total}
      </p>
      <p className="mt-1.5 text-[12.5px] text-white/85">
        차량 이동 기준 · 하루 평균 {formatDistanceKm(avgKm) ?? total}
      </p>
    </section>
  );
}
