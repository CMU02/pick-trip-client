import { formatDistanceKm, sumDayTravel } from "@/lib/itinerary";
import type { Day, TravelMode } from "@/types/itinerary";
import type { ItineraryMapDay } from "@/types/map";

interface TripDistanceCardProps {
  // useItineraryMapData 로 해석한 일차별 지도 데이터. route 는 Kakao 길찾기
  // 실도로 결과이고, 없는 날은 null 이라 합산에서 빠진다. CAR에서만 쓴다.
  mapDays: ItineraryMapDay[];
  // 백엔드 스케줄러가 내려준 일자별 이동값. TRANSIT은 Kakao route가 자동차
  // 전용이라 이 값(도보+버스 모델)을 쓴다.
  days: Day[];
  // 선택된 일정안의 이동수단. 이동수단을 모르는 호출부(저장된 일정 재조회 등)는
  // 기존과 같은 CAR 기본값을 쓴다.
  travelMode?: TravelMode;
}

// 일정 결과 사이드바의 "이동 거리 합계" 박스(디자인 핸드오프 §9). CAR는 Kakao
// 실도로 거리, TRANSIT은 백엔드 대중교통 모델 거리를 쓴다. 기준값을 하나도
// 구하지 못하면 렌더하지 않는다.
export function TripDistanceCard({
  mapDays,
  days,
  travelMode = "CAR",
}: TripDistanceCardProps) {
  let totalKm: number;
  let avgKm: number;
  let basisLabel: string;

  if (travelMode === "CAR") {
    const daysWithRoute = mapDays.filter((d) => d.route);
    if (daysWithRoute.length === 0) return null;
    totalKm = daysWithRoute.reduce(
      (sum, d) => sum + (d.route?.totalDistanceMeters ?? 0) / 1000,
      0,
    );
    avgKm = totalKm / mapDays.length;
    basisLabel = "차량 이동 기준";
  } else {
    const { totalKm: sumKm } = sumDayTravel(days);
    if (!sumKm) return null;
    totalKm = sumKm;
    avgKm = totalKm / days.length;
    basisLabel = "대중교통 이동 기준(도보 포함 근사치)";
  }

  const total = formatDistanceKm(totalKm);
  if (!total) return null;

  return (
    <section className="rounded-[20px] bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] p-5 text-white">
      <p className="text-sm font-bold">이동 거리 합계</p>
      <p className="mt-2 font-heading text-[30px] font-extrabold tracking-[-0.03em]">
        {total}
      </p>
      <p className="mt-1.5 text-[12.5px] text-white/85">
        {basisLabel} · 하루 평균 {formatDistanceKm(avgKm) ?? total}
      </p>
    </section>
  );
}
