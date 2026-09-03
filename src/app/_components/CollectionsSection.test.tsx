import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/collections", () => ({
  HOME_COLLECTIONS: [
    {
      slug: "with-kids",
      title: "아이와 함께 걷기 좋은 곳",
      desc: "완만한 곳만",
      contentIds: ["a", "b", "c"],
    },
    {
      slug: "riverside",
      title: "강 따라 걷는 하루",
      desc: "강변 코스",
      contentIds: ["d", "e"],
    },
    // contentIds가 비면 렌더되지 않는다.
    { slug: "empty", title: "빈 컬렉션", desc: "미완성", contentIds: [] },
  ],
}));

import { CollectionsSection } from "./CollectionsSection";

describe("CollectionsSection", () => {
  it("contentIds가 있는 컬렉션만 행으로 보여준다", () => {
    render(<CollectionsSection />);

    expect(screen.getByText("아이와 함께 걷기 좋은 곳")).toBeInTheDocument();
    expect(screen.getByText("강 따라 걷는 하루")).toBeInTheDocument();
    expect(screen.queryByText("빈 컬렉션")).not.toBeInTheDocument();
  });

  it("각 행의 'N곳'이 contentIds.length와 일치한다", () => {
    render(<CollectionsSection />);

    expect(screen.getByText("3곳")).toBeInTheDocument();
    expect(screen.getByText("2곳")).toBeInTheDocument();
  });

  it("행 링크가 /explore?ids= 로 contentIds를 넘긴다", () => {
    render(<CollectionsSection />);

    expect(
      screen.getByRole("link", { name: /아이와 함께 걷기 좋은 곳/ }),
    ).toHaveAttribute("href", "/explore?ids=a,b,c");
  });
});
