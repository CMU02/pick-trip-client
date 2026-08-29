import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/errors";
import type { Content } from "@/types/content";

import {
  getContentFetchErrorMessage,
  groupContentsByCategory,
  mergeUniqueContents,
  sortContentsByCategory,
  splitBrLines,
  splitPageSizeAcrossRegions,
} from "./content";

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

  it("CONTENT_CATEGORY_ORDER대로 그룹을 반환한다", () => {
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

describe("splitPageSizeAcrossRegions", () => {
  it("지역이 1개면 페이지 크기를 그대로 준다", () => {
    expect(splitPageSizeAcrossRegions(20, 1)).toEqual([20]);
  });

  it("나눠떨어지지 않으면 나머지를 앞 지역부터 1씩 더해 합계를 정확히 맞춘다", () => {
    expect(splitPageSizeAcrossRegions(20, 3)).toEqual([7, 7, 6]);
    expect(splitPageSizeAcrossRegions(20, 2)).toEqual([10, 10]);
    expect(splitPageSizeAcrossRegions(10, 3)).toEqual([4, 3, 3]);
  });

  it("각 지역 몫이 0으로 내려가지 않는다", () => {
    expect(splitPageSizeAcrossRegions(2, 3)).toEqual([1, 1, 1]);
  });

  it("지역 수가 0이면 빈 배열을 반환한다", () => {
    expect(splitPageSizeAcrossRegions(20, 0)).toEqual([]);
  });
});

describe("splitBrLines", () => {
  it("<br> 태그로 나누고 공백/빈 줄을 정리한다", () => {
    expect(splitBrLines("평일 09:00~18:00<br>주말 10:00~17:00")).toEqual([
      "평일 09:00~18:00",
      "주말 10:00~17:00",
    ]);
    expect(splitBrLines("가능 <br/> 요금 (무료)")).toEqual([
      "가능",
      "요금 (무료)",
    ]);
  });

  it("<br>가 없으면 한 줄 그대로", () => {
    expect(splitBrLines("연중무휴")).toEqual(["연중무휴"]);
  });
});

describe("sortContentsByCategory", () => {
  it("CONTENT_CATEGORY_ORDER대로 정렬한다", () => {
    const contents = [
      makeContent({ id: "1", category: "NATURE" }),
      makeContent({ id: "2", category: "FOOD" }),
      makeContent({ id: "3", category: "CULTURE" }),
    ];

    const sorted = sortContentsByCategory(contents);

    expect(sorted.map((c) => c.category)).toEqual([
      "FOOD",
      "CULTURE",
      "NATURE",
    ]);
  });

  it("같은 카테고리 안에서는 원래 순서를 유지한다(안정 정렬)", () => {
    const contents = [
      makeContent({ id: "1", category: "FOOD", name: "첫번째 음식" }),
      makeContent({ id: "2", category: "CULTURE" }),
      makeContent({ id: "3", category: "FOOD", name: "두번째 음식" }),
    ];

    const sorted = sortContentsByCategory(contents);

    expect(sorted.map((c) => c.name)).toEqual([
      "첫번째 음식",
      "두번째 음식",
      "쌍계사",
    ]);
  });

  it("category가 없는 항목은 맨 뒤로 보낸다", () => {
    const contents = [
      makeContent({ id: "1", category: undefined }),
      makeContent({ id: "2", category: "FOOD" }),
    ];

    const sorted = sortContentsByCategory(contents);

    expect(sorted.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const contents = [
      makeContent({ id: "1", category: "NATURE" }),
      makeContent({ id: "2", category: "FOOD" }),
    ];

    sortContentsByCategory(contents);

    expect(contents.map((c) => c.category)).toEqual(["NATURE", "FOOD"]);
  });
});

describe("getContentFetchErrorMessage", () => {
  it("CONTENT_PROVIDER_FAILED면 '일시적인 오류'로 안내하는 문구를 반환한다", () => {
    const err = new ApiError(
      502,
      "콘텐츠를 불러오지 못했습니다. 다시 시도해주세요.",
      "CONTENT_PROVIDER_FAILED",
    );

    expect(getContentFetchErrorMessage(err)).toBe(
      "일시적인 오류로 콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
    );
  });

  it("그 외 ApiError는 서버가 내려준 실제 메시지를 그대로 보여준다", () => {
    const err = new ApiError(
      400,
      "지원하지 않는 지역입니다.",
      "INVALID_REGION",
    );

    expect(getContentFetchErrorMessage(err)).toBe("지원하지 않는 지역입니다.");
  });

  it("ApiError가 아닌 오류는 공통 폴백 메시지를 보여준다", () => {
    expect(getContentFetchErrorMessage(new Error("unexpected"))).toBe(
      "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
  });
});
