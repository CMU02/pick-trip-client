import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CopyLinkBox } from "./CopyLinkBox";

describe("CopyLinkBox", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("현재 페이지 URL을 보여준다", () => {
    render(<CopyLinkBox />);

    expect(screen.getByText(window.location.href)).toBeInTheDocument();
  });

  it("링크 복사 버튼 클릭 시 클립보드에 복사하고 복사됨을 보여준다", async () => {
    render(<CopyLinkBox />);

    await userEvent.click(screen.getByRole("button", { name: "링크 복사" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      window.location.href,
    );
    expect(
      await screen.findByRole("button", { name: "복사됨" }),
    ).toBeInTheDocument();
  });
});
