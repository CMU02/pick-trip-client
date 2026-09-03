import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockWithdraw = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ withdraw: mockWithdraw }),
}));

import { WithdrawSection } from "./WithdrawSection";

describe("WithdrawSection", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockWithdraw.mockReset();
  });

  it("기본은 30일 복구 안내와 '회원 탈퇴' 버튼을 보여준다", () => {
    render(<WithdrawSection />);

    expect(
      screen.getByText(/30일 안에.*다시 로그인하면 계정이 복구/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "회원 탈퇴" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "탈퇴하기" }),
    ).not.toBeInTheDocument();
  });

  it("'회원 탈퇴'를 누르면 확인 단계가 열린다", async () => {
    const user = userEvent.setup();
    render(<WithdrawSection />);

    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));

    expect(screen.getByText("정말 탈퇴하시겠어요?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "탈퇴하기" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  it("'취소'를 누르면 확인 단계가 닫힌다", async () => {
    const user = userEvent.setup();
    render(<WithdrawSection />);

    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.queryByText("정말 탈퇴하시겠어요?")).not.toBeInTheDocument();
    expect(mockWithdraw).not.toHaveBeenCalled();
  });

  it("'탈퇴하기' 성공 시 withdraw를 호출하고 홈으로 이동한다", async () => {
    const user = userEvent.setup();
    mockWithdraw.mockResolvedValueOnce(true);
    render(<WithdrawSection />);

    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(mockWithdraw).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("'탈퇴하기'가 실패하면 오류 문구를 보여주고 이동하지 않는다", async () => {
    const user = userEvent.setup();
    mockWithdraw.mockResolvedValueOnce(false);
    render(<WithdrawSection />);

    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "탈퇴 처리에 실패했습니다",
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
