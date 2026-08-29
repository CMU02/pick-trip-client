import { describe, expect, it } from "vitest";

import { normalizeKakaoDirections } from "./kakaoDirections";

const okResponse = {
  routes: [
    {
      result_code: 0,
      result_msg: "길찾기 성공",
      summary: { distance: 12000, duration: 1800 },
      sections: [
        {
          distance: 5000,
          duration: 800,
          roads: [
            { vertexes: [127.1, 35.1, 127.15, 35.12] },
            { vertexes: [127.15, 35.12, 127.2, 35.15] },
          ],
        },
        {
          distance: 7000,
          duration: 1000,
          roads: [{ vertexes: [127.2, 35.15, 127.3, 35.2] }],
        },
      ],
    },
  ],
};

describe("normalizeKakaoDirections", () => {
  it("총 거리·시간과 구간별 값을 뽑고 vertexes를 [lng,lat] 정점으로 평탄화한다", () => {
    const result = normalizeKakaoDirections(okResponse);

    expect(result).not.toBeNull();
    expect(result?.totalDistanceMeters).toBe(12000);
    expect(result?.totalDurationSeconds).toBe(1800);
    // 구간(section) 수 = segments 수
    expect(result?.segments).toEqual([
      { distanceMeters: 5000, durationSeconds: 800 },
      { distanceMeters: 7000, durationSeconds: 1000 },
    ]);
    // 모든 road vertexes 를 이어붙인 [lng,lat] 쌍
    expect(result?.path).toEqual([
      [127.1, 35.1],
      [127.15, 35.12],
      [127.15, 35.12],
      [127.2, 35.15],
      [127.2, 35.15],
      [127.3, 35.2],
    ]);
  });

  it("result_code가 0이 아니면 null", () => {
    expect(
      normalizeKakaoDirections({
        routes: [{ result_code: 104, sections: [] }],
      }),
    ).toBeNull();
  });

  it("sections가 비면 null", () => {
    expect(
      normalizeKakaoDirections({
        routes: [{ result_code: 0, summary: {}, sections: [] }],
      }),
    ).toBeNull();
  });

  it("routes가 없으면 null", () => {
    expect(normalizeKakaoDirections({})).toBeNull();
    expect(normalizeKakaoDirections(null)).toBeNull();
  });
});
