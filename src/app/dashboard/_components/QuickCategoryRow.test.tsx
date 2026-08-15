import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Content } from "@/types/content";

import { QuickCategoryRow } from "./QuickCategoryRow";

const makeContent = (overrides: Partial<Content> = {}): Content => ({
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군",
  summary: "천년 고찰",
  indoor: false,
  ...overrides,
});

describe("QuickCategoryRow", () => {
  it("카테고리별 콘텐츠 개수를 보여준다", () => {
    const contents = [
      makeContent({ id: "1", category: "CULTURE" }),
      makeContent({ id: "2", category: "CULTURE" }),
      makeContent({ id: "3", category: "FOOD" }),
    ];

    render(
      <QuickCategoryRow
        contents={contents}
        selected="ALL"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(screen.getByText("문화")).toBeInTheDocument();
    expect(screen.getAllByText("3곳")).toHaveLength(1);
    expect(screen.getAllByText("2곳")).toHaveLength(1);
  });

  it("타일을 클릭하면 onSelect를 호출한다", async () => {
    const onSelect = vi.fn();
    render(
      <QuickCategoryRow contents={[]} selected="ALL" onSelect={onSelect} />,
    );

    await userEvent.click(screen.getByText("음식"));

    expect(onSelect).toHaveBeenCalledWith("FOOD");
  });

  it("선택된 카테고리에 aria-pressed를 표시한다", () => {
    render(
      <QuickCategoryRow contents={[]} selected="FOOD" onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /음식/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /전체/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
