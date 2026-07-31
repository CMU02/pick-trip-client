import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useBasketStore } from "@/stores/basketStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import type { Content } from "@/types/content";

import { RecommendedCard } from "./RecommendedCard";

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

describe("RecommendedCard", () => {
  beforeEach(() => {
    localStorage.clear();
    useBasketStore.setState({ items: [], hydrated: true });
    useFavoriteStore.setState({ items: [], hydrated: true });
  });

  it("이름/주소/카테고리 배지를 렌더한다", () => {
    render(<RecommendedCard content={stub} />);

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("경남 하동군")).toBeInTheDocument();
    expect(screen.getByText("문화")).toBeInTheDocument();
  });

  it("담기 버튼 클릭 시 바구니에 담기고 담김으로 바뀐다", async () => {
    render(<RecommendedCard content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "담기" }));

    expect(screen.getByRole("button", { name: "담김" })).toBeInTheDocument();
    expect(useBasketStore.getState().items).toHaveLength(1);
  });

  it("찜 아이콘 클릭 시 찜 목록에 추가되고 다시 누르면 해제된다", async () => {
    render(<RecommendedCard content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "찜하기" }));
    expect(useFavoriteStore.getState().items).toHaveLength(1);
    expect(screen.getByRole("button", { name: "찜 해제" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "찜 해제" }));
    expect(useFavoriteStore.getState().items).toHaveLength(0);
  });
});
