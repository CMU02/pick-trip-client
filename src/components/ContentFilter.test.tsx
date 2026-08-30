import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { CATEGORY_LABELS, CONTENT_CATEGORY_ORDER } from "@/types/content";

import { ContentFilter } from "./ContentFilter";

const REGIONS3 = ["HADONG", "YEONGJU", "YECHEON"] as const;

function setup(overrides: Partial<ComponentProps<typeof ContentFilter>> = {}) {
  const props = {
    regions: [...REGIONS3],
    selectedRegion: "ALL" as const,
    selectedCategories: [],
    keyword: "",
    onRegionChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onKeywordChange: vi.fn(),
    ...overrides,
  };
  render(<ContentFilter {...props} />);
  return props;
}

describe("ContentFilter", () => {
  it("전체 탭 + 지역 탭 + 6개 카테고리 칩을 렌더한다", () => {
    setup();

    expect(screen.getByRole("tab", { name: /전체/ })).toBeInTheDocument();
    for (const label of ["하동", "영주", "예천"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
    for (const label of ["음식", "축제", "관광지", "문화", "자연", "체험"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("카테고리 칩을 CONTENT_CATEGORY_ORDER 순서대로 렌더한다", () => {
    setup();

    const chipLabels = screen
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    const expected = CONTENT_CATEGORY_ORDER.map(
      (category) => CATEGORY_LABELS[category],
    );

    expect(chipLabels).toEqual(expected);
  });

  it("regions prop이 준 지역만 탭으로 렌더한다", () => {
    setup({ regions: ["HADONG"] });

    expect(screen.getByRole("tab", { name: "하동" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "영주" })).not.toBeInTheDocument();
  });

  it("지역 탭 클릭 시 onRegionChange를 그 지역으로 호출한다", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("tab", { name: "하동" }));

    expect(props.onRegionChange).toHaveBeenCalledWith("HADONG");
  });

  it("전체 탭 클릭 시 onRegionChange를 ALL로 호출한다", async () => {
    const props = setup({ selectedRegion: "HADONG" });

    await userEvent.click(screen.getByRole("tab", { name: /전체/ }));

    expect(props.onRegionChange).toHaveBeenCalledWith("ALL");
  });

  it("선택된 지역 탭만 aria-selected=true다", () => {
    setup({ selectedRegion: "HADONG" });

    expect(screen.getByRole("tab", { name: "하동" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "영주" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: /전체/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("카테고리 칩은 라벨 글자 앞에 카테고리 아이콘을 렌더한다", () => {
    setup();

    for (const label of ["음식", "축제", "관광지", "문화", "자연", "체험"]) {
      const button = screen.getByRole("button", { name: label });
      expect(button.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("카테고리 칩 클릭 시 onCategoryChange를 호출한다", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("button", { name: "음식" }));

    expect(props.onCategoryChange).toHaveBeenCalledWith(["FOOD"]);
  });

  it("선택된 카테고리 칩은 aria-pressed=true 속성을 갖는다", () => {
    setup({ selectedCategories: ["FOOD"] });

    expect(screen.getByRole("button", { name: "음식" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "자연" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("검색어 입력 시 onKeywordChange를 호출한다", async () => {
    const props = setup();

    await userEvent.type(screen.getByRole("searchbox"), "쌍");

    expect(props.onKeywordChange).toHaveBeenLastCalledWith("쌍");
  });
});
