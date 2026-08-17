import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("사이트 메뉴 링크를 올바른 href로 보여준다", () => {
    render(<Footer />);

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
      "/select/conditions",
    );
  });

  it("지역 링크가 해당 지역의 여행 조건 페이지로 이동한다", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "하동" })).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG",
    );
    expect(screen.getByRole("link", { name: "영주" })).toHaveAttribute(
      "href",
      "/select/conditions?regions=YEONGJU",
    );
    expect(screen.getByRole("link", { name: "예천" })).toHaveAttribute(
      "href",
      "/select/conditions?regions=YECHEON",
    );
  });

  it("약관과 개인정보처리방침 링크를 보여준다", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: "개인정보처리방침" }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("저작권 문구를 보여준다", () => {
    render(<Footer />);

    expect(
      screen.getByText("© 2026 PickTrip. All rights reserved."),
    ).toBeInTheDocument();
  });
});
