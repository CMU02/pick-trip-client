import { describe, expect, it } from "vitest";

import { haversineKm, isValidKoreaCoord, toLatLng } from "./geo";

describe("isValidKoreaCoord", () => {
  it("0/0 좌표(빈 값의 결과)는 거부한다", () => {
    expect(isValidKoreaCoord(0, 0)).toBe(false);
  });

  it("서울 좌표는 통과한다", () => {
    expect(isValidKoreaCoord(37.5665, 126.978)).toBe(true);
  });

  it("하동 좌표는 통과한다", () => {
    expect(isValidKoreaCoord(35.0672, 127.7515)).toBe(true);
  });

  it("도쿄 좌표(해외)는 거부한다", () => {
    expect(isValidKoreaCoord(35.6762, 139.6503)).toBe(false);
  });

  it("NaN·비수치는 거부한다", () => {
    expect(isValidKoreaCoord(Number.NaN, 127)).toBe(false);
    expect(isValidKoreaCoord("37", "127")).toBe(false);
    expect(isValidKoreaCoord(null, undefined)).toBe(false);
  });

  it("경계값은 포함한다", () => {
    expect(isValidKoreaCoord(33.0, 124.0)).toBe(true);
    expect(isValidKoreaCoord(39.5, 132.5)).toBe(true);
  });
});

describe("toLatLng", () => {
  it("유효 좌표는 LatLng 객체로 반환한다", () => {
    expect(toLatLng(35.0672, 127.7515)).toEqual({
      lat: 35.0672,
      lng: 127.7515,
    });
  });

  it("무효 좌표는 null 을 반환한다", () => {
    expect(toLatLng(0, 0)).toBeNull();
  });
});

describe("haversineKm", () => {
  it("같은 지점은 0 이다", () => {
    const p = { lat: 35.0672, lng: 127.7515 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("서울-부산 직선거리는 약 325km(±5km)", () => {
    const seoul = { lat: 37.5665, lng: 126.978 };
    const busan = { lat: 35.1796, lng: 129.0756 };
    expect(haversineKm(seoul, busan)).toBeGreaterThan(320);
    expect(haversineKm(seoul, busan)).toBeLessThan(330);
  });
});
