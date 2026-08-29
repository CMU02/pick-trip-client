import { describe, expect, it } from "vitest";

import { CATEGORY_COUNT_BY_REGION, categoryCountFor } from "./content";

describe("categoryCountFor", () => {
  it("한 지역 한 카테고리는 그 실측치를 그대로 반환한다", () => {
    expect(categoryCountFor(["CULTURE"], ["HADONG"])).toBe(
      CATEGORY_COUNT_BY_REGION.HADONG.CULTURE,
    );
  });

  it("여러 지역이면 카테고리 수를 합산한다(전 지역 음식 = 53)", () => {
    expect(categoryCountFor(["FOOD"], ["HADONG", "YEONGJU", "YECHEON"])).toBe(
      53,
    );
  });

  it("여러 카테고리도 합산한다", () => {
    expect(categoryCountFor(["FOOD", "CULTURE"], ["YEONGJU"])).toBe(
      CATEGORY_COUNT_BY_REGION.YEONGJU.FOOD +
        CATEGORY_COUNT_BY_REGION.YEONGJU.CULTURE,
    );
  });

  it("빈 지역/카테고리는 0", () => {
    expect(categoryCountFor([], ["HADONG"])).toBe(0);
    expect(categoryCountFor(["CULTURE"], [])).toBe(0);
  });

  it("정적 실측치 합계는 221이다", () => {
    const cats = [
      "FOOD",
      "FESTIVAL",
      "ATTRACTION",
      "CULTURE",
      "NATURE",
      "EXPERIENCE",
    ] as const;
    expect(categoryCountFor([...cats], ["HADONG", "YEONGJU", "YECHEON"])).toBe(
      221,
    );
  });
});
