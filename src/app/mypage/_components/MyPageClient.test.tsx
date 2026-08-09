import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { MyPageClient } from "./MyPageClient";

describe("MyPageClient", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("unauthenticated면 아무것도 렌더하지 않고 '/'로 리다이렉트한다", () => {
    mockUseAuth.mockReturnValue({ status: "unauthenticated", user: null });

    render(<MyPageClient />);

    expect(screen.queryByText("김여행")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("loading이면 아무것도 렌더하지 않고 리다이렉트하지 않는다", () => {
    mockUseAuth.mockReturnValue({ status: "loading", user: null });

    render(<MyPageClient />);

    expect(screen.queryByText("김여행")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("authenticated면 닉네임/이메일/가입일과 로그인 제공자 라벨을 보여준다", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: "user@example.com",
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-15T00:00:00Z",
      },
    });

    render(<MyPageClient />);

    expect(screen.getByText("김여행")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("카카오")).toBeInTheDocument();
    expect(screen.getByText(/2026년 1월 15일/)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("이메일이 없으면 이메일 항목을 표시하지 않는다", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: null,
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-15T00:00:00Z",
      },
    });

    render(<MyPageClient />);

    expect(screen.queryByText("이메일")).not.toBeInTheDocument();
  });

  it("내 여행 바로가기 링크가 /itineraries를 가리킨다", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        uid: "uid-1",
        email: "user@example.com",
        nickname: "김여행",
        profileImageUrl: "",
        provider: "KAKAO",
        createdAt: "2026-01-15T00:00:00Z",
      },
    });

    render(<MyPageClient />);

    expect(screen.getByRole("link", { name: /내 여행/ })).toHaveAttribute(
      "href",
      "/itineraries",
    );
  });
});
