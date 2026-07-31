import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useRecentViewsStore } from "@/stores/recentViewsStore";
import type { Content } from "@/types/content";

import { RecentSection } from "./RecentSection";

const stub: Content = {
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군",
  summary: "천년 고찰",
  indoor: false,
};

describe("RecentSection", () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentViewsStore.setState({ items: [], hydrated: true });
  });

  it("최근 본 콘텐츠가 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<RecentSection />);

    expect(container).toBeEmptyDOMElement();
  });

  it("최근 본 콘텐츠를 상세 페이지 링크로 렌더한다", () => {
    useRecentViewsStore.setState({
      items: [{ content: stub, viewedAt: Date.now() }],
      hydrated: true,
    });

    render(<RecentSection />);

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /쌍계사/ })).toHaveAttribute(
      "href",
      "/contents/1",
    );
  });
});
