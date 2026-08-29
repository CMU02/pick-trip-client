import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LatLng, RouteResult } from "@/types/map";
import { getDirections } from "./directionsService";

const seoul: LatLng = { lat: 37.5665, lng: 126.978 };
const busan: LatLng = { lat: 35.1796, lng: 129.0756 };

const route: RouteResult = {
  totalDistanceMeters: 1000,
  totalDurationSeconds: 120,
  segments: [{ distanceMeters: 1000, durationSeconds: 120 }],
  path: [[126.978, 37.5665]],
};

describe("getDirections", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("좌표가 2개 미만이면 호출 없이 null", async () => {
    expect(await getDirections([seoul])).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ok:true 응답이면 route를 반환한다", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, route }),
    } as Response);

    expect(await getDirections([seoul, busan])).toEqual(route);
    expect(fetch).toHaveBeenCalledWith(
      "/api/directions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("ok:false 응답이면 null", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, error: "directions_unavailable" }),
    } as Response);

    expect(await getDirections([seoul, busan])).toBeNull();
  });

  it("HTTP 오류면 null", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    expect(await getDirections([seoul, busan])).toBeNull();
  });

  it("네트워크 예외면 null", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    expect(await getDirections([seoul, busan])).toBeNull();
  });
});
