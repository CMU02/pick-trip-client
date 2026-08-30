import { describe, expect, it } from "vitest";

import { HOME_COLLECTIONS } from "./collections";

describe("HOME_COLLECTIONS", () => {
  it("slug가 중복되지 않는다", () => {
    const slugs = HOME_COLLECTIONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("모든 컬렉션이 제목과 설명을 갖는다", () => {
    for (const collection of HOME_COLLECTIONS) {
      expect(collection.title.length).toBeGreaterThan(0);
      expect(collection.desc.length).toBeGreaterThan(0);
    }
  });
});
