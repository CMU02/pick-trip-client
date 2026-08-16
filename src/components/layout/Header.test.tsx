import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/contents");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { Header } from "./Header";

describe("Header", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/contents");
  });

  it("로딩 상태에서는 로그인/로그아웃 컨트롤을 보여주지 않는다", () => {
    mockUseAuth.mockReturnValue({
      status: "loading",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(
      screen.queryByRole("link", { name: "로그인" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
  });

  it("비로그인 상태에서는 현재 경로를 next로 담은 로그인 링크를 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    const loginLink = screen.getByRole("link", { name: "로그인" });
    expect(loginLink).toHaveAttribute(
      "href",
      `/login?next=${encodeURIComponent("/contents")}`,
    );
  });

  it("로그인 상태에서는 닉네임과 로그아웃 버튼을 보여주고, 클릭 시 logout을 호출한다", async () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: "user@example.com",
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-01T00:00:00Z",
      },
      logout,
    });

    render(<Header />);

    expect(screen.getByText("김여행")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));
    expect(logout).toHaveBeenCalled();
  });

  it("홈/콘텐츠 탐색/AI일정 네비게이션 링크를 올바른 href로 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "콘텐츠 탐색" })).toHaveAttribute(
      "href",
      "/explore",
    );
    expect(screen.getByRole("link", { name: "AI일정" })).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });

  it("현재 경로와 일치하는 nav 항목만 활성 상태로 표시한다", () => {
    mockUsePathname.mockReturnValue("/select/conditions");
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "AI일정" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(
      screen.getByRole("link", { name: "콘텐츠 탐색" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("/exploredetail 경로에서는 콘텐츠 탐색(/explore) 링크를 활성화하지 않는다", () => {
    mockUsePathname.mockReturnValue("/exploredetail");
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(
      screen.getByRole("link", { name: "콘텐츠 탐색" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("비로그인 상태에서는 마이페이지 링크가 로그인 후 마이페이지로 오도록 next를 고정한다", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute(
      "href",
      "/login?next=/mypage",
    );
  });

  it("로그인 상태에서는 마이페이지 링크가 /mypage를 가리킨다", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: "user@example.com",
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-01T00:00:00Z",
      },
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute(
      "href",
      "/mypage",
    );
  });

  it("로그인 상태에서는 홈/콘텐츠 탐색/AI일정 대신 대시보드 링크만 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: "user@example.com",
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-01T00:00:00Z",
      },
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.queryByRole("link", { name: "홈" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "콘텐츠 탐색" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "AI일정" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "대시보드" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("로그인 상태에서는 /favorites로 이동하는 찜 아이콘 링크를 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: "user@example.com",
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-01T00:00:00Z",
      },
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: "찜한 콘텐츠" })).toHaveAttribute(
      "href",
      "/favorites",
    );
  });

  it("비로그인 상태에서는 찜 아이콘 링크를 보여주지 않는다", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(
      screen.queryByRole("link", { name: "찜한 콘텐츠" }),
    ).not.toBeInTheDocument();
  });

  it("로그인 여부와 무관하게 /contents로 이동하는 바구니 pill을 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: /바구니/ })).toHaveAttribute(
      "href",
      "/contents",
    );
  });
});
