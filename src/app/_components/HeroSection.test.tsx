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
    ).toHaveAttribute("href", "/explore");
    expect(
      screen.getByRole("link", { name: "AI 일정 살펴보기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });

  it("경상도 소도시/여행 콘텐츠/AI 일정 생성 지표를 보여준다", () => {
    render(<HeroSection />);

    expect(screen.getByText("3곳")).toBeInTheDocument();
    expect(screen.getByText("경상도 소도시")).toBeInTheDocument();
    expect(screen.getByText("221개")).toBeInTheDocument();
    expect(screen.getByText("여행 콘텐츠")).toBeInTheDocument();
    expect(screen.getByText("30초")).toBeInTheDocument();
    expect(screen.getByText("AI 일정 생성")).toBeInTheDocument();
  });
});
