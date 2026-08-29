import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kakaoDirections", () => ({
  fetchKakaoDirections: vi.fn(),
}));

import { fetchKakaoDirections } from "@/lib/kakaoDirections";
import type { RouteResult } from "@/types/map";
import { POST } from "./route";

const mockFetch = vi.mocked(fetchKakaoDirections);

function post(body: unknown): Request {
  return new Request("http://localhost/api/directions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const seoul = { lat: 37.5665, lng: 126.978 };
const busan = { lat: 35.1796, lng: 129.0756 };

const sampleRoute: RouteResult = {
  totalDistanceMeters: 1000,
  totalDurationSeconds: 120,
  segments: [{ distanceMeters: 1000, durationSeconds: 120 }],
  path: [
    [126.978, 37.5665],
    [129.0756, 35.1796],
  ],
};

describe("POST /api/directions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("JSON이 아니면 400", async () => {
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
  });

  it("좌표가 2개 미만이면 400", async () => {
    const res = await POST(post({ points: [seoul] }));
    expect(res.status).toBe(400);
  });

  it("한국 범위를 벗어난 좌표가 있으면 400", async () => {
    const res = await POST(
      post({ points: [seoul, { lat: 35.68, lng: 139.77 }] }),
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("정상 좌표면 fetchKakaoDirections 결과를 ok:true로 감싼다", async () => {
    mockFetch.mockResolvedValueOnce(sampleRoute);
    const res = await POST(post({ points: [seoul, busan] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, route: sampleRoute });
    expect(mockFetch).toHaveBeenCalledWith([seoul, busan]);
  });

  it("경로를 못 찾으면 200 + ok:false", async () => {
    mockFetch.mockResolvedValueOnce(null);
    const res = await POST(post({ points: [seoul, busan] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "directions_unavailable",
    });
  });
});
