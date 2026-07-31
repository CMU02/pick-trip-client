import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "./HeroSection";

describe("HeroSection", () => {
  it("헤드라인과 콘텐츠 탐색/AI일정 CTA 링크를 보여준다", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("heading", { name: /하동, 영주, 예천/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "콘텐츠 둘러보기" }),
    ).toHaveAttribute("href", "/contents?regions=HADONG,YEONGJU,YECHEON");
    expect(
      screen.getByRole("link", { name: "AI 일정 살펴보기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });
});
