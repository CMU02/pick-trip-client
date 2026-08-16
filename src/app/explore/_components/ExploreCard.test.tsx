import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Content } from "@/types/content";

import { ExploreCard } from "./ExploreCard";

const stub: Content = {
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군 화개면",
  summary: "천년 고찰, 봄이면 벚꽃이 만발한다",
  indoor: false,
};

describe("ExploreCard", () => {
  it("콘텐츠 이름을 렌더한다", () => {
    render(<ExploreCard content={stub} />);
    expect(screen.getByText("쌍계사")).toBeInTheDocument();
  });

  it("카테고리 한글 라벨을 렌더한다", () => {
    render(<ExploreCard content={stub} />);
    expect(screen.getByText("문화")).toBeInTheDocument();
  });

  it("주소를 렌더한다", () => {
    render(<ExploreCard content={stub} />);
    expect(screen.getByText("경남 하동군 화개면")).toBeInTheDocument();
  });

  it("요약 설명을 렌더한다", () => {
    render(<ExploreCard content={stub} />);
    expect(
      screen.getByText("천년 고찰, 봄이면 벚꽃이 만발한다"),
    ).toBeInTheDocument();
  });

  it("카드 본문이 상세 페이지 링크를 포함한다", () => {
    render(<ExploreCard content={stub} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/contents/1?from=explore");
  });

  it("'상세 설명' 버튼은 상세 페이지로 이동하는 링크다", () => {
    render(<ExploreCard content={stub} />);
    const detailLink = screen.getByRole("link", { name: "상세 설명" });
    expect(detailLink).toHaveAttribute("href", "/contents/1?from=explore");
  });
});
