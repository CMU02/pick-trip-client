import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuickCategoryRow } from "./QuickCategoryRow";

describe("QuickCategoryRow", () => {
  it("문화/음식/관광지/자연/체험/전체 6개 타일과 정적 개수를 보여준다", () => {
    render(<QuickCategoryRow selected="ALL" onSelect={vi.fn()} />);

    for (const label of ["문화", "음식", "관광지", "자연", "체험", "전체"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("25곳")).toBeInTheDocument();
    expect(screen.getByText("13곳")).toBeInTheDocument();
    // 관광지·자연이 둘 다 9곳이라 같은 라벨이 두 번 나온다.
    expect(screen.getAllByText("9곳")).toHaveLength(2);
    expect(screen.getByText("4곳")).toBeInTheDocument();
    expect(screen.getByText("60곳")).toBeInTheDocument();
  });

  it("타일을 클릭하면 onSelect를 호출한다", async () => {
    const onSelect = vi.fn();
    render(<QuickCategoryRow selected="ALL" onSelect={onSelect} />);

    await userEvent.click(screen.getByText("음식"));

    expect(onSelect).toHaveBeenCalledWith("FOOD");
  });

  it("관광지 타일을 클릭하면 onSelect를 ATTRACTION으로 호출한다", async () => {
    const onSelect = vi.fn();
    render(<QuickCategoryRow selected="ALL" onSelect={onSelect} />);

    await userEvent.click(screen.getByText("관광지"));

    expect(onSelect).toHaveBeenCalledWith("ATTRACTION");
  });

  it("선택된 카테고리에 aria-pressed를 표시한다", () => {
    render(<QuickCategoryRow selected="FOOD" onSelect={vi.fn()} />);

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
