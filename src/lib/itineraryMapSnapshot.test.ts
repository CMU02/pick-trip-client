import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ItineraryMapData } from "@/types/map";
import { fromSnapshot, toSnapshot } from "./itineraryMapSnapshot";

const mapData: ItineraryMapData = {
  status: "ready",
  days: [
    {
      dayIndex: 1,
      points: [
        { lat: 35.123456789, lng: 127.987654321, contentId: "a", title: "A" },
        { lat: 35.2, lng: 127.9, contentId: "b", title: "B" },
      ],
      route: {
        totalDistanceMeters: 4200,
        totalDurationSeconds: 600,
        segments: [{ distanceMeters: 4200, durationSeconds: 600 }],
        path: [
          [127.987654321, 35.123456789],
          [127.9, 35.2],
        ],
      },
    },
    // 좌표가 없는 날은 스냅샷에서 제외된다.
    { dayIndex: 2, points: [], route: null },
  ],
};

describe("toSnapshot / fromSnapshot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("좌표를 5자리로 반올림하고 빈 날을 제외하며 savedAt·v를 찍는다", () => {
    const snap = toSnapshot(mapData);

    expect(snap.v).toBe(1);
    expect(snap.savedAt).toBe(Date.parse("2026-08-29T00:00:00Z"));
    expect(snap.days).toHaveLength(1);
    expect(snap.days[0].points[0]).toMatchObject({
      lat: 35.12346,
      lng: 127.98765,
      contentId: "a",
    });
    expect(snap.days[0].route?.path[0]).toEqual([127.98765, 35.12346]);
  });

  it("round-trip 하면 ItineraryMapData(status ready)로 되살아난다", () => {
    const restored = fromSnapshot(toSnapshot(mapData));
    expect(restored?.status).toBe("ready");
    expect(restored?.days).toHaveLength(1);
    expect(restored?.days[0].route?.totalDistanceMeters).toBe(4200);
  });

  it("버전이 다르거나 형식이 깨지면 null", () => {
    expect(fromSnapshot(null)).toBeNull();
    expect(fromSnapshot({ v: 99, days: [] })).toBeNull();
    expect(fromSnapshot({ v: 1 })).toBeNull();
    expect(fromSnapshot("garbage")).toBeNull();
  });
});
