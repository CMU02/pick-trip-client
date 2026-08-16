import { describe, expect, it } from "vitest";

import type { Content } from "@/types/content";

import { groupContentsByCategory, mergeUniqueContents } from "./content";

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

describe("mergeUniqueContents", () => {
  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(mergeUniqueContents([])).toEqual([]);
  });

  it("중복이 없으면 순서를 그대로 유지한다", () => {
    const contents = [makeContent({ id: "1" }), makeContent({ id: "2" })];

    expect(mergeUniqueContents(contents)).toEqual(contents);
  });

  it("같은 id가 여러 번 나오면 먼저 온 항목만 남긴다", () => {
    const first = makeContent({ id: "1", name: "첫 페이지" });
    const duplicate = makeContent({ id: "1", name: "두번째 페이지" });
    const other = makeContent({ id: "2" });

    const result = mergeUniqueContents([first, duplicate, other]);

    expect(result).toEqual([first, other]);
  });
});
