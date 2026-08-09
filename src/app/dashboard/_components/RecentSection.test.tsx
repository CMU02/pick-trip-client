import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useRecentViewsStore } from "@/stores/recentViewsStore";
import type { Content } from "@/types/content";

import { RecentSection } from "./RecentSection";

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

describe("RecentSection", () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentViewsStore.setState({ items: [], hydrated: true });
  });

  it("최근 본 콘텐츠가 없어도 'RECENT'/'최근에 본' 제목은 렌더하고 내용은 비운다", () => {
    render(<RecentSection />);

    expect(screen.getByText("RECENT")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "최근에 본" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("비어있어도 콘텐츠 영역이 카드 높이만큼 공간을 미리 확보한다", () => {
    render(<RecentSection />);

    expect(screen.getByTestId("recent-section-row")).toHaveClass("min-h-16");
  });

  it("최근 본 콘텐츠를 상세 페이지 링크로 렌더한다", () => {
    useRecentViewsStore.setState({
      items: [{ content: makeContent(), viewedAt: Date.now() }],
      hydrated: true,
    });

    render(<RecentSection />);

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /쌍계사/ })).toHaveAttribute(
      "href",
      "/contents/1",
    );
  });

  it("최근 본 순서(왼쪽부터 최신순)로 최대 4개까지만 보여준다", () => {
    useRecentViewsStore.setState({
      items: Array.from({ length: 6 }, (_, i) => ({
        content: makeContent({ id: String(i), name: `콘텐츠${i}` }),
        viewedAt: Date.now() - i,
      })),
      hydrated: true,
    });

    render(<RecentSection />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.textContent)).toEqual([
      expect.stringContaining("콘텐츠0"),
      expect.stringContaining("콘텐츠1"),
      expect.stringContaining("콘텐츠2"),
      expect.stringContaining("콘텐츠3"),
    ]);
  });
});
