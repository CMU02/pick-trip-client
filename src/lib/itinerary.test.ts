import { describe, expect, it } from "vitest";

import { formatDuration } from "./itinerary";

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
