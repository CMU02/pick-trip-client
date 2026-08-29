import type {
  ItineraryMapData,
  ItineraryMapDay,
  ItineraryMapSnapshot,
} from "@/types/map";

// 저장 시점 지도 상태(좌표 + 길찾기 결과)를 localStorage 용으로 직렬화/역직렬화한다.
// 이미지가 아니라 "상태 스냅샷" — 저장된 일정을 볼 때 이 데이터로 라이브 지도를
// 다시 그린다(콘텐츠 재조회·길찾기 재호출 없음). 자세한 배경은
// docs/plan/itinerary-map.md 참고.

const SNAPSHOT_VERSION = 1 as const;

function round(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

function roundDay(day: ItineraryMapDay): ItineraryMapDay {
  return {
    dayIndex: day.dayIndex,
    points: day.points.map((p) => ({
      ...p,
      lat: round(p.lat),
      lng: round(p.lng),
    })),
    route: day.route
      ? {
          ...day.route,
          path: day.route.path.map(
            ([lng, lat]) => [round(lng), round(lat)] as [number, number],
          ),
        }
      : null,
  };
}

export function toSnapshot(mapData: ItineraryMapData): ItineraryMapSnapshot {
  return {
    v: SNAPSHOT_VERSION,
    savedAt: Date.now(),
    // 좌표가 있는 날만 담는다. 저장 시점 아직 해석 중이던 날은 조회 시 라이브 폴백.
    days: mapData.days.filter((d) => d.points.length > 0).map(roundDay),
  };
}

// 저장된(혹은 낡은/손상된) 값을 ItineraryMapData 로 되살린다. 형식이 안 맞으면
// null 을 반환해 호출부가 라이브 해석으로 폴백하게 한다.
export function fromSnapshot(snapshot: unknown): ItineraryMapData | null {
  if (
    typeof snapshot !== "object" ||
    snapshot === null ||
    (snapshot as { v?: unknown }).v !== SNAPSHOT_VERSION ||
    !Array.isArray((snapshot as { days?: unknown }).days)
  ) {
    return null;
  }
  return {
    status: "ready",
    days: (snapshot as ItineraryMapSnapshot).days,
  };
}
