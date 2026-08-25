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

import { HomeGate } from "./HomeGate";

describe("HomeGate", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("authenticated면 children을 렌더하지 않고 /dashboard로 리다이렉트한다", () => {
    mockUseAuth.mockReturnValue({ status: "authenticated" });

    render(
      <HomeGate>
        <p>마케팅 홈</p>
      </HomeGate>,
    );

    expect(screen.queryByText("마케팅 홈")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  // SSR 시점 status는 항상 loading이므로, 여기서 children을 렌더해야 서버 응답
  // HTML에 마케팅 콘텐츠가 담긴다.
  it("loading이면 children을 렌더하고 리다이렉트하지 않는다", () => {
    mockUseAuth.mockReturnValue({ status: "loading" });

    render(
      <HomeGate>
        <p>마케팅 홈</p>
      </HomeGate>,
    );

    expect(screen.getByText("마케팅 홈")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("unauthenticated면 children을 그대로 렌더한다", () => {
    mockUseAuth.mockReturnValue({ status: "unauthenticated" });

    render(
      <HomeGate>
        <p>마케팅 홈</p>
      </HomeGate>,
    );

    expect(screen.getByText("마케팅 홈")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
