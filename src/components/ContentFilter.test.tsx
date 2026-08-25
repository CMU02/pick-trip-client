import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContentFilter } from "./ContentFilter";

describe("ContentFilter", () => {
  it("3개 지역 칩과 6개 카테고리 칩을 렌더한다", () => {
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    for (const label of ["하동", "영주", "예천"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    for (const label of ["음식", "축제", "관광지", "문화", "자연", "체험"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("지역 칩 클릭 시 onRegionChange를 호출한다", async () => {
    const onRegionChange = vi.fn();
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={onRegionChange}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "하동" }));

    expect(onRegionChange).toHaveBeenCalledWith(["HADONG"]);
  });

  it("선택된 지역 칩은 aria-pressed=true 속성을 갖는다", () => {
    render(
      <ContentFilter
        selectedRegions={["HADONG"]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "하동" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "영주" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("카테고리 칩 클릭 시 onCategoryChange를 호출한다", async () => {
    const onCategoryChange = vi.fn();
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={onCategoryChange}
        onKeywordChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "음식" }));

    expect(onCategoryChange).toHaveBeenCalledWith(["FOOD"]);
  });

  it("선택된 카테고리 칩은 aria-pressed=true 속성을 갖는다", () => {
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={["FOOD"]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "음식" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "자연" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("지역·카테고리 칩이 최소 44x44 히트 영역 클래스를 갖는다", () => {
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "하동" })).toHaveClass(
      "tap-target",
    );
    expect(screen.getByRole("button", { name: "음식" })).toHaveClass(
      "tap-target",
    );
  });

  it("검색어 입력 시 onKeywordChange를 호출한다", async () => {
    const onKeywordChange = vi.fn();
    render(
      <ContentFilter
        selectedRegions={[]}
        selectedCategories={[]}
        keyword=""
        onRegionChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onKeywordChange={onKeywordChange}
      />,
    );

    await userEvent.type(screen.getByRole("searchbox"), "쌍");

    expect(onKeywordChange).toHaveBeenLastCalledWith("쌍");
  });
});
