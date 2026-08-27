import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/explore",
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { useBasketStore } from "@/stores/basketStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import type { Content } from "@/types/content";

import { ContentCardActions } from "./ContentCardActions";

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

describe("ContentCardActions", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockUseAuth.mockReturnValue({ status: "authenticated" });
    useBasketStore.setState({ items: [], hydrated: true });
    useFavoriteStore.setState({ items: [], hydrated: true });
  });

  it("담기 버튼 클릭 시 바구니에 담기고 담김으로 바뀐다", async () => {
    render(<ContentCardActions content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "담기" }));

    expect(screen.getByRole("button", { name: "담김" })).toBeInTheDocument();
    expect(useBasketStore.getState().items).toHaveLength(1);
  });

  it("로그인 상태에서 찜 아이콘 클릭 시 추가되고 다시 누르면 해제된다", async () => {
    render(<ContentCardActions content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "찜하기" }));
    expect(useFavoriteStore.getState().items).toHaveLength(1);
    expect(screen.getByRole("button", { name: "찜 해제" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "찜 해제" }));
    expect(useFavoriteStore.getState().items).toHaveLength(0);
  });

  it("비로그인 상태에서는 이미 찜한 콘텐츠라도 하트가 비활성이다", () => {
    mockUseAuth.mockReturnValue({ status: "unauthenticated" });
    useFavoriteStore.setState({ items: [stub], hydrated: true });

    render(<ContentCardActions content={stub} />);

    const heart = screen.getByRole("button", { name: "찜하기" });
    expect(heart).toHaveAttribute("aria-pressed", "false");
  });

  it("비로그인 상태에서 하트를 누르면 로그인으로 유도하고 찜하지 않는다", async () => {
    mockUseAuth.mockReturnValue({ status: "unauthenticated" });

    render(<ContentCardActions content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "찜하기" }));

    expect(mockPush).toHaveBeenCalledWith("/login?next=%2Fexplore");
    expect(useFavoriteStore.getState().items).toHaveLength(0);
  });
});
