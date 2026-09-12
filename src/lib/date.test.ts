import { describe, expect, it } from "vitest";
import { dateToKey, formatDateKey } from "./date";

describe("formatDateKey", () => {
  it("month는 0-base로 받아 1-base로 포맷하고 두 자리로 0을 채운다", () => {
    expect(formatDateKey(2026, 0, 5)).toBe("2026-01-05");
    expect(formatDateKey(2026, 11, 25)).toBe("2026-12-25");
  });
});

describe("dateToKey", () => {
  it("로컬 연/월/일 기준으로 YYYY-MM-DD를 만든다(UTC 변환 없이)", () => {
    // 자정 근처 시각이어도 로컬 날짜 그대로 나와야 한다 — toISOString()을
    // 썼다면 시간대에 따라 하루가 밀릴 수 있다.
    const date = new Date(2026, 0, 5, 23, 59);
    expect(dateToKey(date)).toBe("2026-01-05");
  });
});
