import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Content } from "@/types/content";

import { ExploreGrid } from "./ExploreGrid";

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

describe("ExploreGrid", () => {
  it("지역 필터 선택 시 해당 지역 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", region: "HADONG" }),
      makeContent({ id: "2", name: "부석사", region: "YEONGJU" }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    await userEvent.click(screen.getByRole("button", { name: "하동" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

  it("지역 필터와 카테고리 필터를 동시에 적용하면 두 조건을 모두 만족하는 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({
        id: "1",
        name: "쌍계사",
        region: "HADONG",
        category: "CULTURE",
      }),
      makeContent({
        id: "2",
        name: "하동 재첩국",
        region: "HADONG",
        category: "FOOD",
      }),
      makeContent({
        id: "3",
        name: "부석사",
        region: "YEONGJU",
        category: "CULTURE",
      }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    await userEvent.click(screen.getByRole("button", { name: "하동" }));
    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

  it("전달받은 콘텐츠 카드를 모두 렌더한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("하동 재첩국")).toBeInTheDocument();
  });

  it("카테고리 필터 선택 시 해당 카테고리만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("검색어 입력 시 이름이 일치하는 카드만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    await userEvent.type(screen.getByRole("searchbox"), "쌍계");

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("필터 결과가 없을 때 빈 상태 메시지를 표시한다", async () => {
    render(<ExploreGrid initialContents={[makeContent({ name: "쌍계사" })]} />);

    await userEvent.type(screen.getByRole("searchbox"), "없는콘텐츠xyz");

    expect(
      screen.getByText(/조건에 맞는 콘텐츠가 없습니다/),
    ).toBeInTheDocument();
  });

  it("콘텐츠가 없을 때 빈 상태 메시지를 표시한다", () => {
    render(<ExploreGrid initialContents={[]} />);

    expect(screen.getByText(/콘텐츠가 없습니다/)).toBeInTheDocument();
  });

  it("콘텐츠를 카테고리별 섹션으로 나누어 표시한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "화개장터", category: "CULTURE" }),
      makeContent({ id: "3", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /음식/ })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /문화/ })).toHaveTextContent(
      "2개",
    );
    expect(screen.getByRole("heading", { name: /음식/ })).toHaveTextContent(
      "1개",
    );
  });

  it("카테고리가 없는 콘텐츠는 기타 섹션으로 묶인다", () => {
    render(
      <ExploreGrid
        initialContents={[
          makeContent({ id: "1", name: "쌍계사", category: undefined }),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /기타/ })).toBeInTheDocument();
  });

  it("카테고리 필터 적용 시 선택한 카테고리 섹션만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ExploreGrid initialContents={contents} />);

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /음식/ }),
    ).not.toBeInTheDocument();
  });
});
