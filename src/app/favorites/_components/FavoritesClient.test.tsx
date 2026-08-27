import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/favorites",
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { useBasketStore } from "@/stores/basketStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import type { Content } from "@/types/content";

import { FavoritesClient } from "./FavoritesClient";

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

describe("FavoritesClient", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    localStorage.clear();
    useBasketStore.setState({ items: [], hydrated: true });
    useFavoriteStore.setState({ items: [], hydrated: true });
  });

  it("unauthenticated면 아무것도 렌더하지 않고 '/'로 리다이렉트한다", () => {
    mockUseAuth.mockReturnValue({ status: "unauthenticated", user: null });

    render(<FavoritesClient />);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("찜한 콘텐츠가 없으면 빈 상태 안내를 렌더한다", () => {
    mockUseAuth.mockReturnValue({ status: "authenticated", user: null });

    render(<FavoritesClient />);

    expect(screen.getByText("아직 찜한 콘텐츠가 없습니다")).toBeInTheDocument();
  });

  it("찜한 콘텐츠를 카드로 렌더하고 상세 페이지 링크에 from=favorites를 붙인다", () => {
    mockUseAuth.mockReturnValue({ status: "authenticated", user: null });
    useFavoriteStore.setState({
      items: [makeContent({ id: "1", name: "쌍계사" })],
      hydrated: true,
    });

    render(<FavoritesClient />);

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /쌍계사/ })).toHaveAttribute(
      "href",
      "/contents/1?from=favorites",
    );
  });

  it("가장 최근에 찜한 콘텐츠를 목록 맨 앞에 보여준다", () => {
    mockUseAuth.mockReturnValue({ status: "authenticated", user: null });
    useFavoriteStore.setState({
      items: [
        makeContent({ id: "1", name: "쌍계사" }),
        makeContent({ id: "2", name: "화개장터" }),
      ],
      hydrated: true,
    });

    render(<FavoritesClient />);

    const names = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent);
    expect(names).toEqual(["화개장터", "쌍계사"]);
  });

  it("담긴 콘텐츠가 2개 이상이면 AI 일정 생성 클릭 시 조건 입력 페이지로 이동한다", async () => {
    mockUseAuth.mockReturnValue({ status: "authenticated", user: null });
    useBasketStore.setState({
      items: [
        { content: makeContent({ id: "1" }), addedAt: 1, priority: null },
        { content: makeContent({ id: "2" }), addedAt: 2, priority: null },
      ],
      hydrated: true,
    });

    render(<FavoritesClient />);

    await userEvent.click(
      screen.getAllByRole("button", { name: "AI 일정 생성" })[0],
    );

    expect(mockPush).toHaveBeenCalledWith(
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });
});
