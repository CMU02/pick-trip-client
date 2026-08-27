import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqAccordion } from "./FaqAccordion";

const FIRST_Q = "로그인하지 않아도 이용할 수 있나요?";
const SECOND_Q = "AI 일정 생성은 얼마나 걸리나요?";
const ACCOUNT_Q = "담은 콘텐츠는 얼마나 유지되나요?";

describe("FaqAccordion", () => {
  it("처음에는 첫 항목만 열려 있다", () => {
    render(<FaqAccordion />);

    expect(
      screen.getByRole("button", { name: new RegExp(FIRST_Q) }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: new RegExp(SECOND_Q) }),
    ).toHaveAttribute("aria-expanded", "false");

    expect(
      screen.getByRole("region", { name: new RegExp(FIRST_Q) }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: new RegExp(SECOND_Q) }),
    ).not.toBeInTheDocument();
  });

  it("항목을 클릭하면 열리고 닫힌다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    const firstTrigger = screen.getByRole("button", {
      name: new RegExp(FIRST_Q),
    });
    const secondTrigger = screen.getByRole("button", {
      name: new RegExp(SECOND_Q),
    });

    await user.click(firstTrigger);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: new RegExp(FIRST_Q) }),
    ).not.toBeInTheDocument();

    await user.click(secondTrigger);
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: new RegExp(SECOND_Q) }),
    ).toBeInTheDocument();
    // 한 번에 하나만 열린다
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("카테고리 탭으로 질문을 필터하고, 탭을 바꾸면 열린 항목이 닫힌다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    await user.click(screen.getByRole("button", { name: "계정" }));

    expect(
      screen.getByRole("button", { name: new RegExp(ACCOUNT_Q) }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(FIRST_Q) }),
    ).not.toBeInTheDocument();

    // 탭 전환 직후에는 열린 항목이 없다
    expect(
      screen.queryByRole("region", { name: new RegExp(ACCOUNT_Q) }),
    ).not.toBeInTheDocument();
  });

  it("오류 신고 답변에는 외부 신고 링크가 붙는다", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    await user.click(screen.getByRole("button", { name: "콘텐츠" }));
    await user.click(
      screen.getByRole("button", { name: /장소 정보가 실제와 다릅니다/ }),
    );

    const region = screen.getByRole("region", {
      name: /장소 정보가 실제와 다릅니다/,
    });
    const reportLink = within(region).getByRole("link", {
      name: "콘텐츠 정보 오류 신고",
    });
    expect(reportLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
