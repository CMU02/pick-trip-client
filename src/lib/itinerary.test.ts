import { describe, expect, it } from "vitest";

import type { Day } from "@/types/itinerary";

import {
  formatDayDate,
  formatDistanceKm,
  formatDuration,
  formatTimeRange,
  formatTravelMinutes,
  hasEmptyDay,
  sumDayTravel,
  toSaveDays,
} from "./itinerary";

const makeItem = (overrides: Partial<Day["items"][number]> = {}) => ({
  itemId: "item-1",
  contentId: "c-1",
  title: "쌍계사",
  order: 0,
  reason: "오전 배치",
  pinned: false,
  ...overrides,
});

const makeDay = (overrides: Partial<Day> = {}): Day => ({
  dayId: "day-1",
  dayIndex: 1,
  items: [makeItem()],
  ...overrides,
});

describe("formatDuration", () => {
  it("0이면 당일치기를 반환한다", () => {
    expect(formatDuration(0)).toBe("당일치기");
  });

  it("1이면 1박 2일을 반환한다", () => {
    expect(formatDuration(1)).toBe("1박 2일");
  });

  it("3이면 3박 4일을 반환한다", () => {
    expect(formatDuration(3)).toBe("3박 4일");
  });
});

describe("formatTimeRange", () => {
  it("양쪽이 있으면 범위로 잇는다", () => {
    expect(formatTimeRange("09:30", "11:00")).toBe("09:30 – 11:00");
  });

  it("한쪽만 있으면 그쪽만 반환한다", () => {
    expect(formatTimeRange("09:30", null)).toBe("09:30");
    expect(formatTimeRange(null, "11:00")).toBe("11:00");
  });

  it("둘 다 없으면 null", () => {
    expect(formatTimeRange(null, null)).toBeNull();
    expect(formatTimeRange(undefined, undefined)).toBeNull();
  });
});

describe("formatTravelMinutes", () => {
  it("60분 미만은 분만", () => {
    expect(formatTravelMinutes(45)).toBe("45분");
  });

  it("시간과 분을 함께", () => {
    expect(formatTravelMinutes(90)).toBe("1시간 30분");
  });

  it("정시는 시간만", () => {
    expect(formatTravelMinutes(120)).toBe("2시간");
  });

  it("null이나 0은 null", () => {
    expect(formatTravelMinutes(0)).toBeNull();
    expect(formatTravelMinutes(null)).toBeNull();
    expect(formatTravelMinutes(undefined)).toBeNull();
  });
});

describe("formatDistanceKm", () => {
  it("소수는 1자리로", () => {
    expect(formatDistanceKm(12.44)).toBe("12.4km");
  });

  it("정수는 소수점 없이", () => {
    expect(formatDistanceKm(12)).toBe("12km");
  });

  it("null이나 0은 null", () => {
    expect(formatDistanceKm(0)).toBeNull();
    expect(formatDistanceKm(null)).toBeNull();
    expect(formatDistanceKm(undefined)).toBeNull();
  });
});

describe("formatDayDate", () => {
  it("yyyy-MM-dd를 'M월 D일 (요일)'로 바꾼다", () => {
    // 2025-05-03은 토요일
    expect(formatDayDate("2025-05-03")).toBe("5월 3일 (토)");
    // 2026-07-01은 수요일
    expect(formatDayDate("2026-07-01")).toBe("7월 1일 (수)");
  });

  it("null이나 형식 불일치는 null", () => {
    expect(formatDayDate(null)).toBeNull();
    expect(formatDayDate(undefined)).toBeNull();
    expect(formatDayDate("")).toBeNull();
  });
});

describe("sumDayTravel", () => {
  it("이동값이 있는 날만 합산한다", () => {
    const days = [
      makeDay({ totalTravelMinutes: 30, totalTravelKm: 5.5 }),
      makeDay({ totalTravelMinutes: 45, totalTravelKm: 8.2 }),
      makeDay({ totalTravelMinutes: null, totalTravelKm: null }),
    ];
    expect(sumDayTravel(days)).toEqual({ totalMinutes: 75, totalKm: 13.7 });
  });

  it("어떤 날도 이동값이 없으면 둘 다 null", () => {
    const days = [makeDay(), makeDay({ totalTravelMinutes: null })];
    expect(sumDayTravel(days)).toEqual({ totalMinutes: null, totalKm: null });
  });
});

describe("hasEmptyDay", () => {
  it("장소 0개인 날이 있으면 true", () => {
    expect(hasEmptyDay([makeDay(), makeDay({ items: [] })])).toBe(true);
  });

  it("모든 날에 장소가 있으면 false", () => {
    expect(hasEmptyDay([makeDay(), makeDay()])).toBe(false);
  });
});

describe("toSaveDays", () => {
  it("방문 시각·이동 요약을 왕복시키고 null은 생략한다", () => {
    const days = [
      makeDay({
        dayIndex: 1,
        totalTravelMinutes: 30,
        totalTravelKm: 5.5,
        items: [
          makeItem({ contentId: "c-1", startTime: "09:00", endTime: "10:30" }),
        ],
      }),
      makeDay({
        dayIndex: 2,
        totalTravelMinutes: null,
        totalTravelKm: null,
        items: [makeItem({ contentId: "c-2", startTime: null, endTime: null })],
      }),
    ];

    expect(toSaveDays(days)).toEqual([
      {
        dayIndex: 1,
        totalTravelMinutes: 30,
        totalTravelKm: 5.5,
        items: [
          {
            contentId: "c-1",
            title: "쌍계사",
            order: 0,
            reason: "오전 배치",
            pinned: false,
            startTime: "09:00",
            endTime: "10:30",
          },
        ],
      },
      {
        dayIndex: 2,
        totalTravelMinutes: undefined,
        totalTravelKm: undefined,
        items: [
          {
            contentId: "c-2",
            title: "쌍계사",
            order: 0,
            reason: "오전 배치",
            pinned: false,
            startTime: undefined,
            endTime: undefined,
          },
        ],
      },
    ]);
  });

  it("빈 날도 그대로 남긴다(거르지 않음)", () => {
    const days = [makeDay({ items: [] })];
    expect(toSaveDays(days)[0].items).toEqual([]);
  });
});
