import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useBasketStore } from "@/stores/basketStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import type { Content } from "@/types/content";

import { ForYouGrid } from "./ForYouGrid";

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

describe("ForYouGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    useBasketStore.setState({ items: [], hydrated: true });
    useFavoriteStore.setState({ items: [], hydrated: true });
  });

  it("지역 필터 선택 시 해당 지역 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", region: "HADONG" }),
      makeContent({ id: "2", name: "부석사", region: "YEONGJU" }),
    ];

    render(<ForYouGrid initialContents={contents} />);

    await userEvent.click(screen.getByRole("button", { name: "하동" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

  it("카테고리 필터 선택 시 해당 카테고리만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ForYouGrid initialContents={contents} />);

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("검색어 입력 시 이름이 일치하는 카드만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ForYouGrid initialContents={contents} />);

    await userEvent.type(screen.getByRole("searchbox"), "쌍계");

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("콘텐츠를 카테고리별 섹션으로 나누어 표시한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "화개장터", category: "CULTURE" }),
      makeContent({ id: "3", name: "하동 재첩국", category: "FOOD" }),
    ];

    render(<ForYouGrid initialContents={contents} />);

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /음식/ })).toBeInTheDocument();
  });

  it("콘텐츠가 없을 때 빈 상태 메시지를 표시한다", () => {
    render(<ForYouGrid initialContents={[]} />);

    expect(screen.getByText(/콘텐츠가 없습니다/)).toBeInTheDocument();
  });

  it("필터 결과가 없을 때 빈 상태 메시지를 표시한다", async () => {
    render(<ForYouGrid initialContents={[makeContent({ name: "쌍계사" })]} />);

    await userEvent.type(screen.getByRole("searchbox"), "없는콘텐츠xyz");

    expect(
      screen.getByText(/조건에 맞는 콘텐츠가 없습니다/),
    ).toBeInTheDocument();
  });

  it("카드에서 담기 버튼 클릭 시 바구니에 담긴다", async () => {
    render(<ForYouGrid initialContents={[makeContent()]} />);

    await userEvent.click(screen.getByRole("button", { name: "담기" }));

    expect(useBasketStore.getState().items).toHaveLength(1);
  });
});
