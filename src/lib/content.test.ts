import { describe, expect, it } from "vitest";

import type { Content } from "@/types/content";

import { groupContentsByCategory } from "./content";

const makeContent = (overrides: Partial<Content> = {}): Content => ({
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군 화개면",
  summary: "천년 고찰",
  indoor: false,
  ...overrides,
});

describe("groupContentsByCategory", () => {
  it("콘텐츠가 없으면 빈 배열을 반환한다", () => {
    expect(groupContentsByCategory([])).toEqual([]);
  });

  it("CONTENT_CATEGORIES 선언 순서대로 그룹을 반환한다", () => {
    const contents = [
      makeContent({ id: "1", category: "CULTURE" }),
      makeContent({ id: "2", category: "FOOD" }),
    ];

    const groups = groupContentsByCategory(contents);

    expect(groups.map((g) => g.key)).toEqual(["FOOD", "CULTURE"]);
  });

  it("항목이 없는 카테고리는 그룹에 포함하지 않는다", () => {
    const contents = [makeContent({ id: "1", category: "CULTURE" })];

    const groups = groupContentsByCategory(contents);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("CULTURE");
  });

  it("category가 undefined인 콘텐츠는 '기타' 그룹으로 묶인다", () => {
    const contents = [makeContent({ id: "1", category: undefined })];

    const groups = groupContentsByCategory(contents);

    expect(groups).toEqual([
      { key: "uncategorized", label: "기타", items: contents },
    ]);
  });
});
