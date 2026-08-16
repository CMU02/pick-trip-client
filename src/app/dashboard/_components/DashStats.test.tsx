import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { useBasketStore } from "@/stores/basketStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useSavedItinerariesStore } from "@/stores/savedItinerariesStore";
import type { Content } from "@/types/content";

import { DashStats } from "./DashStats";

const stubContent: Content = {
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군",
  summary: "천년 고찰",
  indoor: false,
};

describe("DashStats", () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
    useBasketStore.setState({
      items: [{ content: stubContent, addedAt: Date.now(), priority: null }],
      hydrated: true,
    });
    useFavoriteStore.setState({ items: [stubContent], hydrated: true });
    useSavedItinerariesStore.setState({ items: [], hydrated: true });
  });

  it("담은 콘텐츠/찜한 장소/저장한 일정 개수를 보여준다", () => {
    render(<DashStats />);

    expect(screen.getByText("담은 콘텐츠")).toBeInTheDocument();
    expect(screen.getByText("찜한 장소")).toBeInTheDocument();
    expect(screen.getByText("저장한 일정")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("통계 카드를 클릭하면 해당 화면으로 이동한다", async () => {
    render(<DashStats />);

    await userEvent.click(screen.getByText("찜한 장소"));

    expect(mockPush).toHaveBeenCalledWith("/favorites");
  });
});
