import type { LatLng, RouteResult } from "@/types/map";

// 서버 전용 모듈. Kakao Mobility 길찾기 REST API 를 호출한다.
// - KAKAO_REST_API_KEY 는 절대 브라우저에 노출하지 않는다(NEXT_PUBLIC_ 아님).
// - 이 파일은 Route Handler(/api/directions)와 공유 페이지 서버 컴포넌트에서만
//   import 한다. 클라이언트에서는 src/services/directionsService.ts 를 쓴다.

const BASE_URL = "https://apis-navi.kakaomobility.com/v1";

// 한 번의 waypoints 요청에 담을 수 있는 경유지 상한(경험적으로 넉넉히 30).
// 하루 일정이 이보다 길면 나눠 호출해 이어붙인다.
const MAX_WAYPOINTS = 30;

export async function fetchKakaoDirections(
  points: LatLng[],
): Promise<RouteResult | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key || points.length < 2) return null;

  const chunks: LatLng[][] = [];
  for (let i = 0; i < points.length - 1; i += MAX_WAYPOINTS) {
    chunks.push(points.slice(i, i + MAX_WAYPOINTS + 1));
  }

  try {
    const parts = await Promise.all(
      chunks.map((chunk) => requestChunk(chunk, key)),
    );
    if (parts.some((p) => p === null)) return null;
    return stitch(parts as RouteResult[]);
  } catch {
    return null;
  }
}

async function requestChunk(
  points: LatLng[],
  key: string,
): Promise<RouteResult | null> {
  // Kakao 좌표계: x=경도, y=위도.
  const body = {
    origin: { x: points[0].lng, y: points[0].lat },
    destination: {
      x: points[points.length - 1].lng,
      y: points[points.length - 1].lat,
    },
    waypoints: points.slice(1, -1).map((p) => ({ x: p.lng, y: p.lat })),
    priority: "RECOMMEND",
  };

  const res = await fetch(`${BASE_URL}/waypoints/directions`, {
    method: "POST",
    headers: {
      Authorization: `KakaoAK ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // 같은 일정의 경로는 잘 바뀌지 않는다. SSR(공유 페이지)에서 하루 캐시.
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) return null;
  return normalizeKakaoDirections(await res.json());
}

// Kakao 응답을 우리 RouteResult 로 정규화한다. 순수 함수(단위 테스트 대상).
export function normalizeKakaoDirections(raw: unknown): RouteResult | null {
  const route = (raw as { routes?: unknown[] })?.routes?.[0] as
    | {
        result_code?: number;
        summary?: { distance?: number; duration?: number };
        sections?: {
          distance?: number;
          duration?: number;
          roads?: { vertexes?: number[] }[];
        }[];
      }
    | undefined;

  if (route?.result_code !== 0) return null;

  const sections = route.sections ?? [];
  if (sections.length === 0) return null;

  const path: [number, number][] = [];
  const segments = sections.map((section) => {
    for (const road of section.roads ?? []) {
      const v = road.vertexes ?? [];
      for (let i = 0; i + 1 < v.length; i += 2) {
        path.push([v[i], v[i + 1]]);
      }
    }
    return {
      distanceMeters: section.distance ?? 0,
      durationSeconds: section.duration ?? 0,
    };
  });

  return {
    totalDistanceMeters: route.summary?.distance ?? 0,
    totalDurationSeconds: route.summary?.duration ?? 0,
    segments,
    path,
  };
}

function stitch(parts: RouteResult[]): RouteResult {
  return parts.reduce((acc, part) => ({
    totalDistanceMeters: acc.totalDistanceMeters + part.totalDistanceMeters,
    totalDurationSeconds: acc.totalDurationSeconds + part.totalDurationSeconds,
    segments: [...acc.segments, ...part.segments],
    path: [...acc.path, ...part.path],
  }));
}
