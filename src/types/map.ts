// 지도 기능 공용 타입. 일정(itinerary) 도메인 타입과는 분리한다 — 지도는
// contentId → 좌표 해석과 길찾기 결과를 얹은 별도 뷰 모델이다.

export interface LatLng {
  lat: number;
  lng: number;
}

// 지도에 찍는 한 지점 = 일정 항목 하나.
export interface RoutePoint extends LatLng {
  contentId: string;
  title: string;
}

// 연속한 두 장소 사이 한 구간(leg).
export interface RouteSegment {
  distanceMeters: number;
  durationSeconds: number;
}

// Kakao 길찾기 정규화 결과.
export interface RouteResult {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  // points 길이 - 1 개. points[i] → points[i+1] 구간.
  segments: RouteSegment[];
  // 전체 경로 폴리라인 정점. Kakao 관례대로 [경도, 위도] 순서로 담는다.
  path: [number, number][];
}

// 하루치 지도 데이터. route 가 null 이면 마커 + 직선 폴백만 그린다.
export interface ItineraryMapDay {
  dayIndex: number;
  points: RoutePoint[];
  route: RouteResult | null;
}

// ItineraryResult 로 흘러가는 지도 데이터 전체.
export interface ItineraryMapData {
  status: "loading" | "ready" | "error";
  days: ItineraryMapDay[];
}

// 저장 시점 상태 스냅샷(localStorage). 이미지가 아니라, 그때 해석한 좌표 +
// 길찾기 결과를 담아 저장된 일정을 볼 때 라이브 지도를 즉시 다시 그린다.
export interface ItineraryMapSnapshot {
  v: 1;
  savedAt: number;
  days: ItineraryMapDay[];
}

// POST /api/directions 요청/응답 계약.
export interface DirectionsRequestBody {
  points: LatLng[];
}

export type DirectionsResponseBody =
  | { ok: true; route: RouteResult }
  | { ok: false; error: string };
