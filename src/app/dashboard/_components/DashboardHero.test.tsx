import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { useBasketStore } from "@/stores/basketStore";
import { useSavedItinerariesStore } from "@/stores/savedItinerariesStore";
import type { Content } from "@/types/content";

import { DashboardHero } from "./DashboardHero";

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

describe("DashboardHero", () => {
  beforeEach(() => {
    localStorage.clear();
    useBasketStore.setState({ items: [], hydrated: true });
    useSavedItinerariesStore.setState({ items: [], hydrated: true });
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: { nickname: "김여행" },
    });
  });

  it("사용자 닉네임으로 인사말을 렌더한다", () => {
    render(<DashboardHero />);
    expect(screen.getByText("안녕하세요, 김여행님 👋")).toBeInTheDocument();
  });

  it("바구니가 비어있으면 빈 상태 배너를 보여준다", () => {
    render(<DashboardHero />);
    expect(screen.getByText("아직 담긴 콘텐츠가 없어요")).toBeInTheDocument();
  });

  it("바구니에 콘텐츠가 있으면 담긴 개수를 보여준다", () => {
    useBasketStore.setState({
      items: [{ content: stubContent, addedAt: Date.now(), priority: null }],
      hydrated: true,
    });

    render(<DashboardHero />);

    expect(screen.getByText("1개의 콘텐츠가 담겨 있어요")).toBeInTheDocument();
  });

  it("'콘텐츠 둘러보기' CTA가 여행조건 입력 페이지로 연결된다", () => {
    render(<DashboardHero />);

    expect(
      screen.getByRole("link", { name: /콘텐츠 둘러보기/ }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });
});
