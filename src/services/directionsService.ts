import type { DirectionsResponseBody, LatLng, RouteResult } from "@/types/map";

// 클라이언트에서 자체 Route Handler(/api/directions)를 호출한다. apiClient(axios,
// 백엔드 프록시)와 계약이 달라 fetch 를 그대로 쓴다. 실패·경로 없음은 모두 null.
export async function getDirections(
  points: LatLng[],
): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  try {
    const res = await fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DirectionsResponseBody;
    return data.ok ? data.route : null;
  } catch {
    return null;
  }
}
