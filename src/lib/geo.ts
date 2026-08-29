import type { LatLng } from "@/types/map";

// 백엔드는 TourAPI mapx/mapy 가 비면 좌표를 0.0 으로 내려준다. 0/0(아프리카
// 앞바다)·해외·NaN 을 걸러 지도에 잘못된 마커가 찍히지 않게 한다. 경상도
// 소도시 서비스지만 범위는 한반도 전체로 넉넉하게 둔다.
const KOREA_BOUNDS = {
  minLat: 33.0,
  maxLat: 39.5,
  minLng: 124.0,
  maxLng: 132.5,
};

export function isValidKoreaCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= KOREA_BOUNDS.minLat &&
    lat <= KOREA_BOUNDS.maxLat &&
    lng >= KOREA_BOUNDS.minLng &&
    lng <= KOREA_BOUNDS.maxLng
  );
}

// 유효한 한국 좌표면 LatLng, 아니면 null. 지도 레이어의 유일한 좌표 관문.
export function toLatLng(lat: number, lng: number): LatLng | null {
  return isValidKoreaCoord(lat, lng) ? { lat, lng } : null;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// 두 좌표의 대권 거리(km). 길찾기 실패 시 직선거리 폴백에 쓴다.
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
