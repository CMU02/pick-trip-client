import { NextResponse } from "next/server";

import { isValidKoreaCoord } from "@/lib/geo";
import { fetchKakaoDirections } from "@/lib/kakaoDirections";
import type { DirectionsResponseBody } from "@/types/map";

export const runtime = "nodejs";

// 브라우저 → 이 핸들러 → Kakao Mobility. Kakao REST 키를 서버에만 두기 위한
// 얇은 프록시. 좌표 목록만 받아 넘기므로 인증은 두지 않는다.
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }

  const points = (body as { points?: unknown })?.points;
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    points.length > 60 ||
    !points.every(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        isValidKoreaCoord(
          (p as { lat?: unknown }).lat,
          (p as { lng?: unknown }).lng,
        ),
    )
  ) {
    return bad("invalid_points");
  }

  const route = await fetchKakaoDirections(
    points.map((p) => ({ lat: p.lat, lng: p.lng })),
  );

  // Kakao 가 경로를 못 찾은 경우도 200 으로 내려, 클라이언트가 정상 폴백으로
  // 처리하게 한다(에러 아님).
  const payload: DirectionsResponseBody = route
    ? { ok: true, route }
    : { ok: false, error: "directions_unavailable" };
  return NextResponse.json(payload);
}

function bad(error: string): NextResponse {
  const payload: DirectionsResponseBody = { ok: false, error };
  return NextResponse.json(payload, { status: 400 });
}
