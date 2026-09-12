import { describe, expect, it } from "vitest";

import { REGIONS } from "@/types/region";

import { defaultTripStartDate, TRIP_COURSES } from "./tripCourses";

describe("TRIP_COURSES", () => {
  it("slug가 중복되지 않는다", () => {
    const slugs = TRIP_COURSES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("모든 코스가 제목과 설명을 갖는다", () => {
    for (const course of TRIP_COURSES) {
      expect(course.title.trim().length).toBeGreaterThan(0);
      expect(course.desc.trim().length).toBeGreaterThan(0);
    }
  });

  it("region이 유효한 Region 값이다", () => {
    for (const course of TRIP_COURSES) {
      expect(REGIONS).toContain(course.region);
    }
  });

  it("각 코스는 장소를 2~5개 갖고, 모든 장소 id는 숫자 문자열이다", () => {
    for (const course of TRIP_COURSES) {
      expect(course.spots.length).toBeGreaterThanOrEqual(2);
      expect(course.spots.length).toBeLessThanOrEqual(5);
      for (const spot of course.spots) {
        expect(spot.id).toMatch(/^\d+$/);
        expect(spot.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("코스 안에서 장소 id가 중복되지 않는다", () => {
    for (const course of TRIP_COURSES) {
      const ids = course.spots.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("defaultTripStartDate", () => {
  it("기준일 + 14일을 YYYY-MM-DD로 반환한다", () => {
    expect(defaultTripStartDate(new Date(2026, 8, 10))).toBe("2026-09-24");
  });

  it("월을 넘어가는 경우에도 자리수를 채운다", () => {
    expect(defaultTripStartDate(new Date(2026, 0, 25))).toBe("2026-02-08");
  });
});
